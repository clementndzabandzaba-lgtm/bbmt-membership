from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Registration, Child, GrandChild
from ..schemas import RegistrationIn, RegistrationOut

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
