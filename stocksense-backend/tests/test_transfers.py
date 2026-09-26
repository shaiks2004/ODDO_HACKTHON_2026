"""Internal transfer endpoint integration tests."""


PRODUCT_ID = "40000000-0000-0000-0000-000000000001"
SOURCE_ID = "30000000-0000-0000-0000-000000000001"
DESTINATION_ID = "30000000-0000-0000-0000-000000000002"


def test_transfer_validation_moves_stock_and_writes_both_ledger_sides(auth_context):
	client = auth_context["client"]
	headers = auth_context["headers"]
	created = client.post(
		"/api/v1/transfers",
		headers=headers,
		json={
			"source_location_id": SOURCE_ID,
			"destination_location_id": DESTINATION_ID,
			"items": [{"product_id": PRODUCT_ID, "quantity": "1.000"}],
		},
	)
	assert created.status_code == 201, created.text
	transfer_id = created.json()["id"]
	validated = client.post(f"/api/v1/transfers/{transfer_id}/validate", headers=headers)
	assert validated.status_code == 200, validated.text
	assert validated.json()["status"] == "DONE"

	again = client.post(f"/api/v1/transfers/{transfer_id}/validate", headers=headers)
	assert again.status_code == 409
	ledger = client.get(f"/api/v1/stock-ledger?reference_id={transfer_id}", headers=headers)
	assert ledger.status_code == 200
	assert ledger.json()["total"] == 2


def test_transfer_not_found_and_same_location_rejected(auth_context):
	client = auth_context["client"]
	headers = auth_context["headers"]
	missing = "ffffffff-ffff-ffff-ffff-ffffffffffff"
	assert client.get(f"/api/v1/transfers/{missing}", headers=headers).status_code == 404
	invalid = client.post(
		"/api/v1/transfers",
		headers=headers,
		json={
			"source_location_id": SOURCE_ID,
			"destination_location_id": SOURCE_ID,
			"items": [{"product_id": PRODUCT_ID, "quantity": "1"}],
		},
	)
	assert invalid.status_code == 422