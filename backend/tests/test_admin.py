import csv
import io

from sqlalchemy.orm import sessionmaker

from app.models import Child, OriginalSpouse, Registration

from .conftest import ADMIN_PASSWORD, ADMIN_USERNAME, VALID_SA_IDS, make_registration_payload


def test_read_registration_with_legacy_invalid_id_number(client, auth_headers, test_engine):
    """Regression test: RegistrationOut must not re-validate ID numbers already
    stored in the DB (e.g. legacy/imported data predating the checksum rule).
    A record like this previously 500'd the entire list/detail endpoints."""
    session_local = sessionmaker(bind=test_engine)
    db = session_local()
    reg = Registration(
        kgoro="Legacy",
        claimant_name="Legacy Person",
        claimant_id_number="1234567890123",  # fails the SA ID checksum
        consent_given=True,
    )
    reg.children.append(Child(name="Legacy Child", id_number="9999999999999", gender="Male"))
    db.add(reg)
    db.commit()
    reg_id = reg.id
    db.close()

    res = client.get("/api/admin/registrations", headers=auth_headers)
    assert res.status_code == 200
    assert any(item["id"] == reg_id for item in res.json()["items"])

    res_single = client.get(f"/api/admin/registrations/{reg_id}", headers=auth_headers)
    assert res_single.status_code == 200
    assert res_single.json()["claimant_id_number"] == "1234567890123"
    assert res_single.json()["children"][0]["id_number"] == "9999999999999"


def test_login_success(client, admin_user):
    res = client.post("/api/admin/login", json=admin_user)
    assert res.status_code == 200
    assert "access_token" in res.json()


def test_login_failure(client, admin_user):
    res = client.post("/api/admin/login", json={"username": ADMIN_USERNAME, "password": "wrong"})
    assert res.status_code == 401


def test_login_rate_limited(client, admin_user):
    for _ in range(10):
        res = client.post("/api/admin/login", json={"username": ADMIN_USERNAME, "password": "wrong"})
        assert res.status_code == 401
    res = client.post("/api/admin/login", json=admin_user)
    assert res.status_code == 429


def test_list_requires_auth(client):
    res = client.get("/api/admin/registrations")
    assert res.status_code == 401


def test_approve_reject_workflow(client, auth_headers):
    reg = client.post("/api/registrations", json=make_registration_payload()).json()

    res = client.patch(
        f"/api/admin/registrations/{reg['id']}/status",
        json={"status": "approved", "review_note": "Looks good"},
        headers=auth_headers,
    )
    assert res.status_code == 200
    assert res.json()["status"] == "approved"
    assert res.json()["reviewed_by"] == ADMIN_USERNAME

    res = client.patch(
        f"/api/admin/registrations/{reg['id']}/status",
        json={"status": "rejected", "review_note": "Missing info"},
        headers=auth_headers,
    )
    assert res.status_code == 200
    assert res.json()["status"] == "rejected"


def test_edit_registration_preserves_consent(client, auth_headers):
    reg = client.post("/api/registrations", json=make_registration_payload()).json()
    assert reg["consent_given"] is True

    payload = make_registration_payload(kgoro="Updated Kgoro", consent_given=False)
    res = client.patch(f"/api/admin/registrations/{reg['id']}", json=payload, headers=auth_headers)
    assert res.status_code == 200
    assert res.json()["kgoro"] == "Updated Kgoro"


def test_edit_registration_updates_spouses(client, auth_headers):
    payload = make_registration_payload(
        original_spouses=[{"title": "Mrs", "name": "Wife One", "id_number": VALID_SA_IDS[2]}]
    )
    reg = client.post("/api/registrations", json=payload).json()
    assert len(reg["original_spouses"]) == 1

    edit_payload = make_registration_payload(
        original_spouses=[
            {"title": "Mrs", "name": "Wife One", "id_number": VALID_SA_IDS[2]},
            {"title": "Mrs", "name": "Wife Two", "id_number": VALID_SA_IDS[3]},
        ],
        claimant_spouses=[],
    )
    res = client.patch(f"/api/admin/registrations/{reg['id']}", json=edit_payload, headers=auth_headers)
    assert res.status_code == 200
    assert len(res.json()["original_spouses"]) == 2

    # Editing again with an empty list removes all spouses.
    clear_payload = make_registration_payload(original_spouses=[], claimant_spouses=[])
    res2 = client.patch(f"/api/admin/registrations/{reg['id']}", json=clear_payload, headers=auth_headers)
    assert res2.status_code == 200
    assert res2.json()["original_spouses"] == []


def test_read_registration_with_legacy_invalid_spouse_id(client, auth_headers, test_engine):
    """Same regression class as test_read_registration_with_legacy_invalid_id_number,
    but for the new spouse tables: a spouse row with a non-conforming ID number
    (e.g. from the legacy-data backfill) must not crash list/detail reads."""
    session_local = sessionmaker(bind=test_engine)
    db = session_local()
    reg = Registration(
        kgoro="Legacy",
        claimant_name="Legacy Person",
        claimant_id_number=VALID_SA_IDS[0],
        consent_given=True,
    )
    reg.original_spouses.append(OriginalSpouse(title="Mrs", name="Legacy Wife", id_number="1234567890123"))
    db.add(reg)
    db.commit()
    reg_id = reg.id
    db.close()

    res = client.get(f"/api/admin/registrations/{reg_id}", headers=auth_headers)
    assert res.status_code == 200
    assert res.json()["original_spouses"][0]["id_number"] == "1234567890123"


def test_delete_registration(client, auth_headers):
    reg = client.post("/api/registrations", json=make_registration_payload()).json()
    res = client.delete(f"/api/admin/registrations/{reg['id']}", headers=auth_headers)
    assert res.status_code == 204

    res = client.get(f"/api/admin/registrations/{reg['id']}", headers=auth_headers)
    assert res.status_code == 404


def test_audit_log_records_actions(client, auth_headers):
    reg = client.post("/api/registrations", json=make_registration_payload()).json()
    client.patch(
        f"/api/admin/registrations/{reg['id']}/status",
        json={"status": "approved", "review_note": "ok"},
        headers=auth_headers,
    )

    res = client.get(f"/api/admin/audit-log?registration_id={reg['id']}", headers=auth_headers)
    assert res.status_code == 200
    actions = [entry["action"] for entry in res.json()]
    assert "approved" in actions


def test_search_by_membership_number(client, auth_headers):
    reg = client.post("/api/registrations", json=make_registration_payload(reference_no="SEARCHME")).json()

    res = client.get(
        f"/api/admin/registrations?q={reg['membership_number']}", headers=auth_headers
    )
    assert res.status_code == 200
    ids = [item["id"] for item in res.json()["items"]]
    assert reg["id"] in ids

    res_bare = client.get(f"/api/admin/registrations?q={reg['id']}", headers=auth_headers)
    assert reg["id"] in [item["id"] for item in res_bare.json()["items"]]


def test_csv_export_includes_membership_number_and_import_ignores_it(client, auth_headers):
    reg = client.post("/api/registrations", json=make_registration_payload(reference_no="MN-EXPORT")).json()

    export_res = client.get("/api/admin/registrations/export.csv", headers=auth_headers)
    rows = list(csv.DictReader(io.StringIO(export_res.text)))
    target_row = next(r for r in rows if r["ID"] == str(reg["id"]))
    assert target_row["Membership Number"] == reg["membership_number"]

    # Re-importing the export (including the Membership Number column) must not error.
    buffer = io.StringIO()
    writer = csv.DictWriter(buffer, fieldnames=list(rows[0].keys()))
    writer.writeheader()
    writer.writerow(target_row)
    import_res = client.post(
        "/api/admin/registrations/import",
        files={"file": ("import.csv", buffer.getvalue().encode("utf-8"), "text/csv")},
        headers=auth_headers,
    )
    assert import_res.status_code == 200
    assert import_res.json()["errors"] == []


def test_list_registrations_with_nested_children(client, auth_headers):
    payload = make_registration_payload(
        reference_no="WITH-CHILDREN",
        children=[{"name": "Kid", "id_number": VALID_SA_IDS[2], "gender": "Male", "contact": ""}],
        grandchildren=[{"name": "GKid", "id_number": VALID_SA_IDS[3], "gender": "Female"}],
    )
    client.post("/api/registrations", json=payload)

    res = client.get("/api/admin/registrations", headers=auth_headers)
    assert res.status_code == 200
    body = res.json()
    assert body["items"][0]["children"][0]["name"] == "Kid"
    assert body["items"][0]["grandchildren"][0]["name"] == "GKid"


def test_pagination_boundaries(client, auth_headers):
    for i in range(3):
        payload = make_registration_payload(
            reference_no=f"PAGE-{i}",
            original_member_id_number=VALID_SA_IDS[i],
            claimant_id_number=None,
        )
        client.post("/api/registrations", json=payload)

    res = client.get("/api/admin/registrations?page=1&page_size=2", headers=auth_headers)
    assert res.status_code == 200
    body = res.json()
    assert len(body["items"]) == 2
    assert body["total"] >= 3
    assert body["page"] == 1

    res2 = client.get("/api/admin/registrations?page=2&page_size=2", headers=auth_headers)
    assert res2.status_code == 200
    assert len(res2.json()["items"]) >= 1


def test_csv_export_import_round_trip(client, auth_headers):
    payload = make_registration_payload(reference_no="CSV-ROUNDTRIP")
    reg = client.post("/api/registrations", json=payload).json()

    export_res = client.get("/api/admin/registrations/export.csv", headers=auth_headers)
    assert export_res.status_code == 200

    rows = list(csv.DictReader(io.StringIO(export_res.text)))
    target_row = next(r for r in rows if r["ID"] == str(reg["id"]))
    target_row["Kgoro"] = "Imported Kgoro"

    buffer = io.StringIO()
    writer = csv.DictWriter(buffer, fieldnames=list(rows[0].keys()))
    writer.writeheader()
    writer.writerow(target_row)
    csv_bytes = buffer.getvalue().encode("utf-8")

    import_res = client.post(
        "/api/admin/registrations/import",
        files={"file": ("import.csv", csv_bytes, "text/csv")},
        headers=auth_headers,
    )
    assert import_res.status_code == 200
    summary = import_res.json()
    assert summary["updated"] == 1
    assert summary["errors"] == []

    check = client.get(f"/api/admin/registrations/{reg['id']}", headers=auth_headers)
    assert check.json()["kgoro"] == "Imported Kgoro"
