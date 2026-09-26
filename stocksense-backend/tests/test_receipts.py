"""Receipt endpoint integration tests."""


LOCATION_ID = "30000000-0000-0000-0000-000000000001"
PRODUCT_ID = "40000000-0000-0000-0000-000000000001"


def test_receipt_create_validate_and_idempotency(auth_context):
	client = auth_context["client"]
	headers = auth_context["headers"]
	created = client.post(
		"/api/v1/receipts",
		headers=headers,
		json={
			"supplier_name": "Integration Supplier",
			"destination_location_id": LOCATION_ID,
			"items": [{"product_id": PRODUCT_ID, "quantity": "2.500"}],
		},
	)
	assert created.status_code == 201, created.text
	receipt = created.json()
	assert receipt["status"] == "DRAFT"
	assert receipt["items"][0]["quantity"] == "2.500"

	validated = client.post(f"/api/v1/receipts/{receipt['id']}/validate", headers=headers)
	assert validated.status_code == 200, validated.text
	assert validated.json()["status"] == "DONE"

	duplicate = client.post(f"/api/v1/receipts/{receipt['id']}/validate", headers=headers)
	assert duplicate.status_code == 409
	ledger = client.get(
		f"/api/v1/stock-ledger?reference_id={receipt['id']}", headers=headers
	)
	assert ledger.status_code == 200
	assert ledger.json()["total"] == 1


def test_receipt_not_found_and_invalid_payload(auth_context):
	client = auth_context["client"]
	headers = auth_context["headers"]
	missing = "ffffffff-ffff-ffff-ffff-ffffffffffff"
	assert client.get(f"/api/v1/receipts/{missing}", headers=headers).status_code == 404
	invalid = client.post(
		"/api/v1/receipts",
		headers=headers,
		json={"supplier_name": "Supplier", "destination_location_id": LOCATION_ID, "items": []},
	)
	assert invalid.status_code == 422


def test_receipt_print_flow(auth_context):
	client = auth_context["client"]
	headers = auth_context["headers"]
	created = client.post(
		"/api/v1/receipts",
		headers=headers,
		json={
			"supplier_name": "Print Supplier",
			"destination_location_id": LOCATION_ID,
			"items": [{"product_id": PRODUCT_ID, "quantity": "1.000"}],
		},
	)
	assert created.status_code == 201
	receipt_id = created.json()["id"]

	# Printing DRAFT receipt fails
	unprinted = client.get(f"/api/v1/receipts/{receipt_id}/print", headers=headers)
	assert unprinted.status_code == 409

	# Validate receipt to DONE
	client.post(f"/api/v1/receipts/{receipt_id}/validate", headers=headers)

	# Printing DONE receipt returns 200 HTML
	printed = client.get(f"/api/v1/receipts/{receipt_id}/print", headers=headers)
	assert printed.status_code == 200
	assert "text/html" in printed.headers["content-type"]
	assert "Goods Receipt Slip" in printed.text