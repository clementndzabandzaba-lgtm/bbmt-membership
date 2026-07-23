from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from ..database import get_db
from ..document_utils import validate_document_upload
from ..models import Registration, Child, Document, GrandChild
from ..schemas import DocumentOut, RegistrationIn, RegistrationOut

router = APIRouter(prefix="/api/registrations", tags=["registrations"])


@router.post("", response_model=RegistrationOut, status_code=201)
def create_registration(payload: RegistrationIn, db: Session = Depends(get_db)):
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


@router.post("/{registration_id}/documents", response_model=DocumentOut, status_code=201)
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
