"""Create DB tables and an admin user from ADMIN_USERNAME/ADMIN_PASSWORD in .env.

Run once after setting up the database:
    python seed_admin.py
"""
import os

from dotenv import load_dotenv

from app.auth import sync_admin_user
from app.database import Base, SessionLocal, engine
from app.migrations import run_startup_migrations

load_dotenv()


def main():
    Base.metadata.create_all(bind=engine)
    run_startup_migrations(engine)

    username = os.getenv("ADMIN_USERNAME", "admin")
    password = os.getenv("ADMIN_PASSWORD")
    if not password:
        raise SystemExit("Set ADMIN_PASSWORD in your .env file before seeding.")

    db = SessionLocal()
    try:
        result = sync_admin_user(db, username, password)
        print(f"Admin user '{username}': {result}.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
