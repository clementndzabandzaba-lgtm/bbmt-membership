import io
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from openpyxl import Workbook
from sqlalchemy.orm import Session, joinedload

from ..auth import create_access_token, get_current_admin, verify_password
from ..database import get_db
from ..models import AdminUser, Registration
from ..schemas import LoginIn, RegistrationOut, TokenOut

router = APIRouter(prefix="/api/admin", tags=["admin"])

REGISTRATION_COLUMNS = [
    ("id", "ID"),
    ("created_at", "Submitted At"),
    ("kgoro", "Kgoro"),
    ("mokgomane", "Mokgomane"),
    ("section", "Section"),
    ("receipt_number", "Receipt Number"),
    ("reference_no", "Reference No"),
    ("stand_no", "Stand No"),
    ("zone", "Zone"),
    ("original_member_title", "Main Member Title (Orig. Dispossessed)"),
    ("original_member_name", "Main Member Name (Orig. Dispossessed)"),
    ("original_member_id_number", "Main Member ID (Orig. Dispossessed)"),
    ("original_spouse_title", "Spouse Title (Orig. Dispossessed)"),
    ("original_spouse_name", "Spouse Name (Orig. Dispossessed)"),
    ("original_spouse_id_number", "Spouse ID (Orig. Dispossessed)"),
    ("claimant_title", "Main Member Title (Main Claimant)"),
    ("claimant_name", "Main Member Name (Main Claimant)"),
    ("claimant_id_number", "Main Member ID (Main Claimant)"),
    ("claimant_spouse_title", "Spouse Title (Main Claimant)"),
    ("claimant_spouse_name", "Spouse Name (Main Claimant)"),
    ("claimant_spouse_id_number", "Spouse ID (Main Claimant)"),
    ("relationship_to_odi", "Relationship to Odi"),
    ("email", "Email"),
    ("place_of_origin", "Place of Origin / Ancestral Place of Origin"),
    ("business_details", "Business Details / Additional Details"),
    ("origin_ethnicity", "Origin / Ethnicity"),
    ("family_representative", "Family Representative"),
    ("power_of_attorney", "Power of Attorney"),
]


@router.post("/login", response_model=TokenOut)
def login(payload: LoginIn, db: Session = Depends(get_db)):
    admin = db.query(AdminUser).filter(AdminUser.username == payload.username).first()
    if not admin or not verify_password(payload.password, admin.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )
    token = create_access_token(subject=admin.username)
    return TokenOut(access_token=token)


@router.get("/registrations", response_model=list[RegistrationOut])
def list_registrations(
    db: Session = Depends(get_db), _admin: AdminUser = Depends(get_current_admin)
):
    registrations = (
        db.query(Registration)
        .options(joinedload(Registration.children), joinedload(Registration.grandchildren))
        .order_by(Registration.created_at.desc())
        .all()
    )
    return registrations


@router.get("/registrations/export")
def export_registrations(
    db: Session = Depends(get_db), _admin: AdminUser = Depends(get_current_admin)
):
    registrations = (
        db.query(Registration)
        .options(joinedload(Registration.children), joinedload(Registration.grandchildren))
        .order_by(Registration.created_at.asc())
        .all()
    )

    wb = Workbook()

    main_sheet = wb.active
    main_sheet.title = "Registrations"
    main_sheet.append([label for _, label in REGISTRATION_COLUMNS])
    for reg in registrations:
        row = []
        for field, _ in REGISTRATION_COLUMNS:
            value = getattr(reg, field)
            if isinstance(value, datetime):
                value = value.strftime("%Y-%m-%d %H:%M:%S")
            row.append(value)
        main_sheet.append(row)

    children_sheet = wb.create_sheet("Children")
    children_sheet.append(["Registration ID", "Main Member Name", "Child Name", "ID Number", "Gender", "Contact"])
    for reg in registrations:
        for child in reg.children:
            children_sheet.append(
                [reg.id, reg.claimant_name or reg.original_member_name, child.name, child.id_number, child.gender, child.contact]
            )

    grandchildren_sheet = wb.create_sheet("Grandchildren")
    grandchildren_sheet.append(["Registration ID", "Main Member Name", "Grandchild Name", "ID Number", "Gender"])
    for reg in registrations:
        for gc in reg.grandchildren:
            grandchildren_sheet.append(
                [reg.id, reg.claimant_name or reg.original_member_name, gc.name, gc.id_number, gc.gender]
            )

    for sheet in wb.worksheets:
        for column_cells in sheet.columns:
            length = max((len(str(cell.value)) if cell.value is not None else 0) for cell in column_cells)
            sheet.column_dimensions[column_cells[0].column_letter].width = min(max(length + 2, 10), 45)

    buffer = io.BytesIO()
    wb.save(buffer)
    buffer.seek(0)

    filename = f"bbmt_membership_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
    return StreamingResponse(
        buffer,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
