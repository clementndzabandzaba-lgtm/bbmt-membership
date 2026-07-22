from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class ChildIn(BaseModel):
    name: Optional[str] = None
    id_number: Optional[str] = None
    gender: Optional[str] = None
    contact: Optional[str] = None


class GrandChildIn(BaseModel):
    name: Optional[str] = None
    id_number: Optional[str] = None
    gender: Optional[str] = None


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

    children: list[ChildIn] = []
    grandchildren: list[GrandChildIn] = []


class RegistrationOut(RegistrationIn):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime


class LoginIn(BaseModel):
    username: str
    password: str


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
