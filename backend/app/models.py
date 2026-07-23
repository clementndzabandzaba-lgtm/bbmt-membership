from datetime import datetime

from sqlalchemy import (
    Boolean,
    Column,
    Integer,
    LargeBinary,
    String,
    Text,
    DateTime,
    ForeignKey,
)
from sqlalchemy.orm import relationship

from .database import Base


class Registration(Base):
    __tablename__ = "registrations"

    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Top section
    kgoro = Column(String(150))
    mokgomane = Column(String(150))
    section = Column(String(150))
    receipt_number = Column(String(100))
    reference_no = Column(String(100))
    stand_no = Column(String(100))
    zone = Column(String(100))

    # Main member - Originally Dispossessed
    original_member_title = Column(String(10))
    original_member_name = Column(String(200))
    original_member_id_number = Column(String(20))
    original_spouse_title = Column(String(10))
    original_spouse_name = Column(String(200))
    original_spouse_id_number = Column(String(20))

    # Main member - Main claimant
    claimant_title = Column(String(10))
    claimant_name = Column(String(200))
    claimant_id_number = Column(String(20))
    claimant_spouse_title = Column(String(10))
    claimant_spouse_name = Column(String(200))
    claimant_spouse_id_number = Column(String(20))

    relationship_to_odi = Column(String(200))
    email = Column(String(200))

    # Origin / business
    place_of_origin = Column(String(300))
    business_details = Column(Text)
    origin_ethnicity = Column(String(200))
    family_representative = Column(String(200))
    power_of_attorney = Column(String(200))

    status = Column(String(20), nullable=False, default="pending", server_default="pending")
    review_note = Column(Text)
    reviewed_at = Column(DateTime)
    reviewed_by = Column(String(100))
    seen_by_admin = Column(Boolean, nullable=False, default=False, server_default="false")

    children = relationship(
        "Child", back_populates="registration", cascade="all, delete-orphan"
    )
    grandchildren = relationship(
        "GrandChild", back_populates="registration", cascade="all, delete-orphan"
    )
    documents = relationship(
        "Document", back_populates="registration", cascade="all, delete-orphan"
    )


class Child(Base):
    __tablename__ = "children"

    id = Column(Integer, primary_key=True, index=True)
    registration_id = Column(Integer, ForeignKey("registrations.id"), nullable=False)
    name = Column(String(200))
    id_number = Column(String(20))
    gender = Column(String(10))
    contact = Column(String(50))

    registration = relationship("Registration", back_populates="children")


class GrandChild(Base):
    __tablename__ = "grandchildren"

    id = Column(Integer, primary_key=True, index=True)
    registration_id = Column(Integer, ForeignKey("registrations.id"), nullable=False)
    name = Column(String(200))
    id_number = Column(String(20))
    gender = Column(String(10))

    registration = relationship("Registration", back_populates="grandchildren")


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    registration_id = Column(
        Integer, ForeignKey("registrations.id", ondelete="CASCADE"), nullable=False, index=True
    )
    doc_type = Column(String(30), nullable=False)
    filename = Column(String(255))
    content_type = Column(String(100), nullable=False)
    data = Column(LargeBinary, nullable=False)
    uploaded_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    registration = relationship("Registration", back_populates="documents")


class AdminUser(Base):
    __tablename__ = "admin_users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
