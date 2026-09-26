"""Printable document endpoint integration tests using Jinja2 HTML rendering."""

LOCATION_ID = "30000000-0000-0000-0000-000000000001"
PRODUCT_ID = "40000000-0000-0000-0000-000000000001"


def test_receipt_print_html_when_done_and_rejected_when_draft(auth_context):
    client = auth_context["client"]
    headers = auth_context["headers"]

    # 1. Create a draft receipt
    created = client.post(
        "/api/v1/receipts",
        headers=headers,
        json={
            "supplier_name": "Acme Metal Supplies",
            "destination_location_id": LOCATION_ID,
            "items": [{"product_id": PRODUCT_ID, "quantity": "5.000"}],
        },
    )
    assert created.status_code == 201
    receipt_id = created.json()["id"]
    reference = created.json()["reference"]

    # In DRAFT status: print is rejected with 400 (InvalidOperationStatusError)
    res_draft = client.get(f"/api/v1/receipts/{receipt_id}/print", headers=headers)
    assert res_draft.status_code == 400, res_draft.text

    # Validate receipt to move to DONE
    val = client.post(f"/api/v1/receipts/{receipt_id}/validate", headers=headers)
    assert val.status_code == 200
    assert val.json()["status"] == "DONE"

    # In DONE status: print returns 200 server-rendered HTML
    res_done = client.get(f"/api/v1/receipts/{receipt_id}/print", headers=headers)
    assert res_done.status_code == 200, res_done.text
    assert "text/html" in res_done.headers["content-type"]
    html = res_done.text
    assert "<!DOCTYPE html>" in html
    assert reference in html
    assert "Acme Metal Supplies" in html
    assert "DONE" in html
    assert "StockSense" in html
    assert "5.000" in html


def test_delivery_print_html_when_done_and_rejected_when_not_done(auth_context):
    client = auth_context["client"]
    headers = auth_context["headers"]

    # 1. Create delivery
    created = client.post(
        "/api/v1/deliveries",
        headers=headers,
        json={
            "customer_name": "Global Construction Corp",
            "source_location_id": LOCATION_ID,
            "items": [{"product_id": PRODUCT_ID, "quantity": "1.000"}],
        },
    )
    assert created.status_code == 201
    delivery_id = created.json()["id"]
    reference = created.json()["reference"]

    # In DRAFT status: print is rejected with 400
    assert client.get(f"/api/v1/deliveries/{delivery_id}/print", headers=headers).status_code == 400

    # Prepare delivery -> READY
    client.post(f"/api/v1/deliveries/{delivery_id}/prepare", headers=headers)

    # In READY status: still rejected with 400
    assert client.get(f"/api/v1/deliveries/{delivery_id}/print", headers=headers).status_code == 400

    # Validate delivery -> DONE
    val = client.post(f"/api/v1/deliveries/{delivery_id}/validate", headers=headers)
    assert val.status_code == 200
    assert val.json()["status"] == "DONE"

    # In DONE status: returns 200 HTML
    res_done = client.get(f"/api/v1/deliveries/{delivery_id}/print", headers=headers)
    assert res_done.status_code == 200
    assert "text/html" in res_done.headers["content-type"]
    html = res_done.text
    assert "<!DOCTYPE html>" in html
    assert reference in html
    assert "Global Construction Corp" in html
    assert "DONE" in html
    assert "1.000" in html


def test_print_not_found_and_unauthorized(auth_context, client):
    headers = auth_context["headers"]
    missing = "ffffffff-ffff-ffff-ffff-ffffffffffff"

    # 404 for non-existent documents
    assert client.get(f"/api/v1/receipts/{missing}/print", headers=headers).status_code == 404
    assert client.get(f"/api/v1/deliveries/{missing}/print", headers=headers).status_code == 404

    # 401 when unauthenticated
    assert client.get(f"/api/v1/receipts/{missing}/print").status_code == 401
    assert client.get(f"/api/v1/deliveries/{missing}/print").status_code == 401
