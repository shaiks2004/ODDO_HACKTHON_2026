"""Physical stock adjustment endpoint integration tests."""

from decimal import Decimal

from sqlalchemy import select

from app.models import Inventory


PRODUCT_ID = "40000000-0000-0000-0000-000000000001"
LOCATION_ID = "30000000-0000-0000-0000-000000000001"


def test_adjustment_validation_uses_server_computed_difference(auth_context, db_session):
	client = auth_context["client"]
	headers = auth_context["headers"]
	inventory = db_session.scalar(
		select(Inventory).where(Inventory.product_id == PRODUCT_ID, Inventory.location_id == LOCATION_ID)
	)
	assert inventory is not None
	target = inventory.on_hand + Decimal("2.000")
	created = client.post(
		"/api/v1/adjustments",
		headers=headers,
		json={
			"product_id": PRODUCT_ID,
			"location_id": LOCATION_ID,
			"physical_quantity": str(target),
			"reason": "Integration physical count",
		},
	)
	assert created.status_code == 201, created.text
	adjustment = created.json()
	assert Decimal(adjustment["system_quantity"]) == inventory.on_hand
	assert Decimal(adjustment["difference"]) == Decimal("2.000")

	validated = client.post(f"/api/v1/adjustments/{adjustment['id']}/validate", headers=headers)
	assert validated.status_code == 200, validated.text
	assert validated.json()["status"] == "DONE"
	again = client.post(f"/api/v1/adjustments/{adjustment['id']}/validate", headers=headers)
	assert again.status_code == 409


def test_stale_adjustment_is_rejected(auth_context, db_session):
	client = auth_context["client"]
	headers = auth_context["headers"]
	inventory = db_session.scalar(
		select(Inventory).where(Inventory.product_id == PRODUCT_ID, Inventory.location_id == LOCATION_ID)
	)
	assert inventory is not None
	created = client.post(
		"/api/v1/adjustments",
		headers=headers,
		json={
			"product_id": PRODUCT_ID,
			"location_id": LOCATION_ID,
			"physical_quantity": str(inventory.on_hand + Decimal("10")),
			"reason": "Will become stale",
		},
	)
	assert created.status_code == 201
	adjustment_id = created.json()["id"]

	receipt = client.post(
		"/api/v1/receipts",
		headers=headers,
		json={
			"supplier_name": "Concurrent stock change",
			"destination_location_id": LOCATION_ID,
			"items": [{"product_id": PRODUCT_ID, "quantity": "1.000"}],
		},
	)
	assert receipt.status_code == 201
	assert client.post(
		f"/api/v1/receipts/{receipt.json()['id']}/validate", headers=headers
	).status_code == 200

	stale = client.post(f"/api/v1/adjustments/{adjustment_id}/validate", headers=headers)
	assert stale.status_code == 409


def test_adjustment_not_found_and_invalid_payload(auth_context):
	client = auth_context["client"]
	headers = auth_context["headers"]
	missing = "ffffffff-ffff-ffff-ffff-ffffffffffff"
	assert client.get(f"/api/v1/adjustments/{missing}", headers=headers).status_code == 404
	invalid = client.post(
		"/api/v1/adjustments",
		headers=headers,
		json={
			"product_id": PRODUCT_ID,
			"location_id": LOCATION_ID,
			"physical_quantity": "-1",
			"reason": "Invalid count",
		},
	)
	assert invalid.status_code == 422