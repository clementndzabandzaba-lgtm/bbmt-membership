import logging

from sqlalchemy import text
from sqlalchemy.engine import Engine

logger = logging.getLogger("bbmt.migrations")

_REGISTRATION_COLUMN_MIGRATIONS = [
    "ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'pending'",
    "ADD COLUMN IF NOT EXISTS review_note TEXT",
    "ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP",
    "ADD COLUMN IF NOT EXISTS reviewed_by VARCHAR(100)",
    "ADD COLUMN IF NOT EXISTS seen_by_admin BOOLEAN NOT NULL DEFAULT FALSE",
    "ADD COLUMN IF NOT EXISTS consent_given BOOLEAN NOT NULL DEFAULT FALSE",
]


def run_startup_migrations(engine: Engine) -> None:
    """Idempotently add columns introduced after the initial schema.

    Base.metadata.create_all() only creates missing tables, it never alters
    existing ones, so new nullable/defaulted columns on `registrations` need
    to be added explicitly. Postgres only (sqlite dev DBs already get the new
    columns for free since create_all() builds the whole table from scratch).
    """
    if engine.dialect.name != "postgresql":
        logger.info("Skipping raw-SQL migrations on dialect %s", engine.dialect.name)
        return
    with engine.begin() as conn:
        for clause in _REGISTRATION_COLUMN_MIGRATIONS:
            conn.execute(text(f"ALTER TABLE registrations {clause}"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_registrations_status ON registrations (status)"))
