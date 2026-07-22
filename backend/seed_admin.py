"""Create DB tables and an admin user from ADMIN_USERNAME/ADMIN_PASSWORD in .env.

Run once after setting up the database:
    python seed_admin.py
"""
import os

from dotenv import load_dotenv

from app.auth import hash_password
from app.database import Base, SessionLocal, engine
from app.models import AdminUser

load_dotenv()


def main():
    Base.metadata.create_all(bind=engine)

    username = os.getenv("ADMIN_USERNAME", "admin")
    password = os.getenv("ADMIN_PASSWORD")
    if not password:
        raise SystemExit("Set ADMIN_PASSWORD in your .env file before seeding.")

    db = SessionLocal()
    try:
        existing = db.query(AdminUser).filter(AdminUser.username == username).first()
        if existing:
            existing.password_hash = hash_password(password)
            db.commit()
            print(f"Updated password for existing admin user '{username}'.")
        else:
            admin = AdminUser(username=username, password_hash=hash_password(password))
            db.add(admin)
            db.commit()
            print(f"Created admin user '{username}'.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
