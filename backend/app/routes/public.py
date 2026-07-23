from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from ..database import get_db
from ..document_utils import validate_document_upload
from ..models import Registration, Child, Document, GrandChild
from ..rate_limit import rate_limit
from ..schemas import DocumentOut, RegistrationIn, RegistrationOut

router = APIRouter(prefix="/api/registrations", tags=["registrations"])


def _find_duplicate(db: Session, payload: RegistrationIn) -> Registration | None:
    id_numbers = [v for v in (payload.original_member_id_number, payload.claimant_id_number) if v]
    if not id_numbers:
        return None
    return (
        db.query(Registration)
        .filter(
            Registration.status != "rejected",
            (
                Registration.original_member_id_number.in_(id_numbers)
                | Registration.claimant_id_number.in_(id_numbers)
            ),
        )
        .first()
    )


@router.post(
    "",
    response_model=RegistrationOut,
    status_code=201,
    dependencies=[Depends(rate_limit(max_requests=5, window_seconds=600))],
)
def create_registration(payload: RegistrationIn, db: Session = Depends(get_db)):
    if not payload.consent_given:
        raise HTTPException(
            status_code=400,
            detail="You must consent to the processing of this information before submitting.",
        )

    duplicate = _find_duplicate(db, payload)
    if duplicate:
        raise HTTPException(
            status_code=409,
            detail=f"A registration with this ID number already exists (status: {duplicate.status}). "
            "Please contact the office if you believe this is an error.",
        )

    data = payload.model_dump(exclude={"children", "grandchildren"})
    registration = Registration(**data)

    for child in payload.children:
        if any(getattr(child, field) for field in child.model_fields):
            registration.children.append(Child(**child.model_dump()))

    for grandchild in payload.grandchildren:
        if any(getattr(grandchild, field) for field in grandchild.model_fields):
            registration.grandchildren.append(GrandChild(**grandchild.model_dump()))

    db.add(registration)
    db.commit()
    db.refresh(registration)
    return registration


@router.post(
    "/{registration_id}/documents",
    response_model=DocumentOut,
    status_code=201,
    dependencies=[Depends(rate_limit(max_requests=20, window_seconds=3600))],
)
async def upload_document(
    registration_id: int,
    doc_type: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    registration = db.query(Registration).filter(Registration.id == registration_id).first()
    if not registration:
        raise HTTPException(status_code=404, detail="Registration not found")
    if registration.status != "pending":
        raise HTTPException(
            status_code=400,
            detail="Documents can only be attached while the registration is still pending review",
        )

    contents = await file.read()
    validate_document_upload(doc_type, file, contents)

    doc = Document(
        registration_id=registration_id,
        doc_type=doc_type,
        filename=file.filename,
        content_type=file.content_type,
        data=contents,
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return doc
