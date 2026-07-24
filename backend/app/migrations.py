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
    "ADD COLUMN IF NOT EXISTS update_reference VARCHAR(50)",
]


_SPOUSE_BACKFILLS = [
    (
        "original_spouses",
        "original_spouse_title",
        "original_spouse_name",
        "original_spouse_id_number",
    ),
    (
        "claimant_spouses",
        "claimant_spouse_title",
        "claimant_spouse_name",
        "claimant_spouse_id_number",
    ),
]


def _backfill_legacy_spouses(engine: Engine) -> None:
    """One-time (idempotent) copy of the old single-spouse columns into the
    new original_spouses/claimant_spouses tables, so pre-existing production
    registrations show their spouse in the new repeatable-spouse UI too.
    Dialect-agnostic — a local dev DB can carry the same kind of legacy data.
    """
    with engine.begin() as conn:
        for table, title_col, name_col, id_col in _SPOUSE_BACKFILLS:
            conn.execute(
                text(
                    f"""
                    INSERT INTO {table} (registration_id, title, name, id_number)
                    SELECT id, {title_col}, {name_col}, {id_col}
                    FROM registrations r
                    WHERE {name_col} IS NOT NULL AND {name_col} != ''
                    AND NOT EXISTS (
                        SELECT 1 FROM {table} s WHERE s.registration_id = r.id
                    )
                    """
                )
            )


def run_startup_migrations(engine: Engine) -> None:
    """Idempotently add columns introduced after the initial schema.

    Base.metadata.create_all() only creates missing tables, it never alters
    existing ones, so new nullable/defaulted columns on `registrations` need
    to be added explicitly. Postgres only (sqlite dev DBs already get the new
    columns for free since create_all() builds the whole table from scratch).
    """
    if engine.dialect.name == "postgresql":
        with engine.begin() as conn:
            for clause in _REGISTRATION_COLUMN_MIGRATIONS:
                conn.execute(text(f"ALTER TABLE registrations {clause}"))
            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_registrations_status ON registrations (status)"))
    else:
        logger.info("Skipping raw-SQL column migrations on dialect %s", engine.dialect.name)

    _backfill_legacy_spouses(engine)
