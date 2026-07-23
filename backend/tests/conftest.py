import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.auth import hash_password
from app.database import Base, get_db
from app.main import app
from app.models import AdminUser
from app.rate_limit import _buckets

# A handful of pre-computed valid South African ID numbers (13 digits,
# correct Luhn check digit) for use across tests.
VALID_SA_IDS = [
    "8001015009087",
    "8506156009084",
    "9001015009086",
    "7503205019082",
    "8808125009082",
]

ADMIN_USERNAME = "testadmin"
ADMIN_PASSWORD = "testpass123"


@pytest.fixture()
def test_engine():
    # Fresh in-memory DB per test (StaticPool keeps one connection alive so
    # the schema/data persist across the multiple connections a single test
    # request cycle can open).
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    yield engine
    engine.dispose()


@pytest.fixture(autouse=True)
def override_get_db(test_engine):
    testing_session_local = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

    def _get_db():
        db = testing_session_local()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = _get_db
    yield
    app.dependency_overrides.clear()


@pytest.fixture(autouse=True)
def reset_rate_limits():
    _buckets.clear()
    yield
    _buckets.clear()


@pytest.fixture()
def client():
    return TestClient(app)


@pytest.fixture()
def admin_user(test_engine):
    testing_session_local = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)
    db = testing_session_local()
    db.add(AdminUser(username=ADMIN_USERNAME, password_hash=hash_password(ADMIN_PASSWORD)))
    db.commit()
    db.close()
    return {"username": ADMIN_USERNAME, "password": ADMIN_PASSWORD}


@pytest.fixture()
def auth_headers(client, admin_user):
    res = client.post("/api/admin/login", json=admin_user)
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def make_registration_payload(**overrides):
    payload = {
        "kgoro": "Test Kgoro",
        "mokgomane": "Test Mok",
        "section": "Sec A",
        "receipt_number": "R1",
        "reference_no": "REF1",
        "stand_no": "S1",
        "zone": "Z1",
        "original_member_title": "Mr",
        "original_member_name": "John Doe",
        "original_member_id_number": VALID_SA_IDS[0],
        "claimant_title": "Mr",
        "claimant_name": "John Doe Jr",
        "claimant_id_number": VALID_SA_IDS[1],
        "relationship_to_odi": "Son",
        "email": "john@example.com",
        "place_of_origin": "Makapanstad",
        "origin_ethnicity": "Bakgatla",
        "family_representative": "John Doe",
        "power_of_attorney": "N/A",
        "consent_given": True,
        "children": [],
        "grandchildren": [],
    }
    payload.update(overrides)
    return payload
