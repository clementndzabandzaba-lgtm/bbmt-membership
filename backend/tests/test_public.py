from .conftest import VALID_SA_IDS, make_registration_payload


def test_create_registration_with_optional_fields_blank(client):
    payload = make_registration_payload(
        original_spouse_title="",
        original_spouse_name="",
        original_spouse_id_number="",
        claimant_spouse_id_number="",
        business_details="",
        children=[{"name": "Child One", "id_number": "", "gender": "Male", "contact": ""}],
    )
    res = client.post("/api/registrations", json=payload)
    assert res.status_code == 201
    body = res.json()
    assert body["status"] == "pending"
    assert not body["original_spouse_name"]
    assert len(body["children"]) == 1


def test_create_registration_requires_consent(client):
    payload = make_registration_payload(consent_given=False)
    res = client.post("/api/registrations", json=payload)
    assert res.status_code == 400
    assert "consent" in res.json()["detail"].lower()


def test_create_registration_rejects_invalid_id_checksum(client):
    payload = make_registration_payload(claimant_id_number="1234567890123")
    res = client.post("/api/registrations", json=payload)
    assert res.status_code == 422


def test_create_registration_rejects_duplicate_id(client):
    payload = make_registration_payload(reference_no="FIRST")
    res1 = client.post("/api/registrations", json=payload)
    assert res1.status_code == 201

    duplicate_payload = make_registration_payload(reference_no="SECOND")
    res2 = client.post("/api/registrations", json=duplicate_payload)
    assert res2.status_code == 409


def test_create_registration_rate_limited(client):
    for i in range(5):
        payload = make_registration_payload(
            original_member_id_number=VALID_SA_IDS[i % len(VALID_SA_IDS)],
            claimant_id_number=None,
            reference_no=f"REF-{i}",
        )
        res = client.post("/api/registrations", json=payload)
        assert res.status_code in (201, 409)

    payload = make_registration_payload(
        original_member_id_number=None, claimant_id_number=None, reference_no="REF-OVER-LIMIT"
    )
    res = client.post("/api/registrations", json=payload)
    assert res.status_code == 429


def test_document_upload_accepts_valid_png(client):
    reg = client.post("/api/registrations", json=make_registration_payload()).json()
    png_bytes = (
        b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01"
        b"\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\x0cIDATx\x9cc\xf8\xcf\xc0"
        b"\x00\x00\x03\x01\x01\x00\x18\xdd\x8d\xb0\x00\x00\x00\x00IEND\xaeB`\x82"
    )
    res = client.post(
        f"/api/registrations/{reg['id']}/documents",
        data={"doc_type": "id_copy"},
        files={"file": ("test.png", png_bytes, "image/png")},
    )
    assert res.status_code == 201
    assert res.json()["doc_type"] == "id_copy"


def test_document_upload_rejects_non_png(client):
    reg = client.post("/api/registrations", json=make_registration_payload()).json()
    res = client.post(
        f"/api/registrations/{reg['id']}/documents",
        data={"doc_type": "id_copy"},
        files={"file": ("fake.png", b"not a real png", "image/png")},
    )
    assert res.status_code == 400


def test_document_upload_accepts_jpeg_and_pdf(client):
    reg = client.post("/api/registrations", json=make_registration_payload()).json()

    jpeg_bytes = b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x00\x00\x01\x00\x01\x00\x00\xff\xd9"
    res = client.post(
        f"/api/registrations/{reg['id']}/documents",
        data={"doc_type": "birth_certificate"},
        files={"file": ("cert.jpg", jpeg_bytes, "image/jpeg")},
    )
    assert res.status_code == 201

    pdf_bytes = b"%PDF-1.4\n%mock pdf content\n%%EOF"
    res = client.post(
        f"/api/registrations/{reg['id']}/documents",
        data={"doc_type": "power_of_attorney"},
        files={"file": ("poa.pdf", pdf_bytes, "application/pdf")},
    )
    assert res.status_code == 201
    assert res.json()["doc_type"] == "power_of_attorney"


def test_document_upload_rejects_mismatched_signature(client):
    reg = client.post("/api/registrations", json=make_registration_payload()).json()
    # Claims to be a PDF via content-type, but the bytes are actually a PNG signature.
    png_bytes = b"\x89PNG\r\n\x1a\n" + b"\x00" * 20
    res = client.post(
        f"/api/registrations/{reg['id']}/documents",
        data={"doc_type": "id_copy"},
        files={"file": ("fake.pdf", png_bytes, "application/pdf")},
    )
    assert res.status_code == 400


def test_membership_number_is_derived_and_unique(client):
    payload1 = make_registration_payload(reference_no="MN-1")
    payload2 = make_registration_payload(
        reference_no="MN-2",
        original_member_id_number=VALID_SA_IDS[2],
        claimant_id_number=VALID_SA_IDS[3],
    )
    reg1 = client.post("/api/registrations", json=payload1).json()
    reg2 = client.post("/api/registrations", json=payload2).json()

    assert reg1["membership_number"] == f"BBMT-{reg1['id']:06d}"
    assert reg2["membership_number"] == f"BBMT-{reg2['id']:06d}"
    assert reg1["membership_number"] != reg2["membership_number"]


def test_update_reference_bypasses_duplicate_check_when_valid(client):
    original = client.post("/api/registrations", json=make_registration_payload(reference_no="ORIGINAL")).json()

    update_payload = make_registration_payload(
        reference_no="UPDATE", update_reference=original["membership_number"]
    )
    res = client.post("/api/registrations", json=update_payload)
    assert res.status_code == 201
    assert res.json()["update_reference"] == original["membership_number"]


def test_update_reference_does_not_bypass_when_bogus(client):
    client.post("/api/registrations", json=make_registration_payload(reference_no="ORIGINAL"))

    update_payload = make_registration_payload(reference_no="UPDATE", update_reference="BBMT-999999")
    res = client.post("/api/registrations", json=update_payload)
    assert res.status_code == 409


def test_create_registration_with_multiple_spouses(client):
    payload = make_registration_payload(
        original_spouses=[
            {"title": "Mrs", "name": "First Wife", "id_number": VALID_SA_IDS[2]},
            {"title": "Mrs", "name": "Second Wife", "id_number": VALID_SA_IDS[3]},
        ],
        claimant_spouses=[{"title": "Mrs", "name": "Claimant Wife", "id_number": VALID_SA_IDS[4]}],
    )
    res = client.post("/api/registrations", json=payload)
    assert res.status_code == 201
    body = res.json()
    assert len(body["original_spouses"]) == 2
    assert {s["name"] for s in body["original_spouses"]} == {"First Wife", "Second Wife"}
    assert len(body["claimant_spouses"]) == 1
    assert body["claimant_spouses"][0]["name"] == "Claimant Wife"
