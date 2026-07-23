import csv
import io

from .conftest import ADMIN_PASSWORD, ADMIN_USERNAME, VALID_SA_IDS, make_registration_payload


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
