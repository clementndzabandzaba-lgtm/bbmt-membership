from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, field_validator

from .validators import is_valid_sa_id

ID_NUMBER_ERROR = "Must be a valid 13-digit South African ID number"


def _validate_id_number(value: Optional[str]) -> Optional[str]:
    if value and not is_valid_sa_id(value):
        raise ValueError(ID_NUMBER_ERROR)
    return value


class ChildIn(BaseModel):
    name: Optional[str] = None
    id_number: Optional[str] = None
    gender: Optional[str] = None
    contact: Optional[str] = None

    @field_validator("id_number")
    @classmethod
    def _check_id_number(cls, value):
        return _validate_id_number(value)


class GrandChildIn(BaseModel):
    name: Optional[str] = None
    id_number: Optional[str] = None
    gender: Optional[str] = None

    @field_validator("id_number")
    @classmethod
    def _check_id_number(cls, value):
        return _validate_id_number(value)


class RegistrationIn(BaseModel):
    kgoro: Optional[str] = None
    mokgomane: Optional[str] = None
    section: Optional[str] = None
    receipt_number: Optional[str] = None
    reference_no: Optional[str] = None
    stand_no: Optional[str] = None
    zone: Optional[str] = None

    original_member_title: Optional[str] = None
    original_member_name: Optional[str] = None
    original_member_id_number: Optional[str] = None
    original_spouse_title: Optional[str] = None
    original_spouse_name: Optional[str] = None
    original_spouse_id_number: Optional[str] = None

    claimant_title: Optional[str] = None
    claimant_name: Optional[str] = None
    claimant_id_number: Optional[str] = None
    claimant_spouse_title: Optional[str] = None
    claimant_spouse_name: Optional[str] = None
    claimant_spouse_id_number: Optional[str] = None

    relationship_to_odi: Optional[str] = None
    email: Optional[str] = None

    place_of_origin: Optional[str] = None
    business_details: Optional[str] = None
    origin_ethnicity: Optional[str] = None
    family_representative: Optional[str] = None
    power_of_attorney: Optional[str] = None

    consent_given: bool = False

    children: list[ChildIn] = []
    grandchildren: list[GrandChildIn] = []

    @field_validator(
        "original_member_id_number",
        "original_spouse_id_number",
        "claimant_id_number",
        "claimant_spouse_id_number",
    )
    @classmethod
    def _check_id_number(cls, value):
        return _validate_id_number(value)


class DocumentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    registration_id: int
    doc_type: str
    filename: Optional[str] = None
    content_type: str
    uploaded_at: datetime


class RegistrationOut(RegistrationIn):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    status: str = "pending"
    review_note: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    reviewed_by: Optional[str] = None
    seen_by_admin: bool = False
    is_new: Optional[bool] = None
    documents: list[DocumentOut] = []


class RegistrationListOut(BaseModel):
    items: list[RegistrationOut]
    total: int
    page: int
    page_size: int
    pending_count: int
    new_count: int
    children_count: int
    grandchildren_count: int


class AuditLogOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    registration_id: Optional[int] = None
    registration_label: Optional[str] = None
    admin_username: str
    action: str
    detail: Optional[str] = None
    created_at: datetime


class StatusUpdateIn(BaseModel):
    status: Literal["pending", "approved", "rejected"]
    review_note: Optional[str] = None


class ImportRowError(BaseModel):
    row: int
    error: str


class ImportSummaryOut(BaseModel):
    created: int
    updated: int
    skipped: int
    errors: list[ImportRowError] = []


class MarkSeenIn(BaseModel):
    ids: Optional[list[int]] = None


class LoginIn(BaseModel):
    username: str
    password: str


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
