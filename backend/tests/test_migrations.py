from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base
from app.migrations import run_startup_migrations
from app.models import Registration


def test_backfill_legacy_spouses_is_idempotent():
    engine = create_engine(
        "sqlite:///:memory:", connect_args={"check_same_thread": False}, poolclass=StaticPool
    )
    Base.metadata.create_all(bind=engine)

    session_local = sessionmaker(bind=engine)
    db = session_local()
    reg = Registration(
        kgoro="Legacy",
        original_member_name="Legacy Member",
        original_spouse_title="Mrs",
        original_spouse_name="Legacy Spouse",
        original_spouse_id_number="8001015009087",
        claimant_name="Legacy Claimant",
        consent_given=True,
    )
    db.add(reg)
    db.commit()
    reg_id = reg.id
    db.close()

    run_startup_migrations(engine)

    db = session_local()
    row = db.execute(
        text("SELECT name, title, id_number FROM original_spouses WHERE registration_id = :id"),
        {"id": reg_id},
    ).fetchone()
    assert row is not None
    assert row[0] == "Legacy Spouse"
    assert row[1] == "Mrs"
    assert row[2] == "8001015009087"
    count_before = db.execute(text("SELECT COUNT(*) FROM original_spouses")).scalar()
    db.close()

    # Running the migration again must not duplicate the backfilled row.
    run_startup_migrations(engine)

    db = session_local()
    count_after = db.execute(text("SELECT COUNT(*) FROM original_spouses")).scalar()
    db.close()
    assert count_after == count_before

    engine.dispose()
