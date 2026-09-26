"""Delivery endpoint integration tests."""

from sqlalchemy import select

from app.models import Inventory


LOCATION_ID = "30000000-0000-0000-0000-000000000001"
PRODUCT_ID = "40000000-0000-0000-0000-000000000001"


def test_delivery_prepare_validate_and_idempotency(auth_context):
	client = auth_context["client"]
	headers = auth_context["headers"]
	created = client.post(
		"/api/v1/deliveries",
		headers=headers,
		json={
			"customer_name": "Integration Customer",
			"source_location_id": LOCATION_ID,
			"items": [{"product_id": PRODUCT_ID, "quantity": "1.000"}],
		},
	)
	assert created.status_code == 201, created.text
	delivery_id = created.json()["id"]

	prepared = client.post(f"/api/v1/deliveries/{delivery_id}/prepare", headers=headers)
	assert prepared.status_code == 200
	assert prepared.json()["status"] == "READY"

	validated = client.post(f"/api/v1/deliveries/{delivery_id}/validate", headers=headers)
	assert validated.status_code == 200
	assert validated.json()["status"] == "DONE"
	assert client.post(f"/api/v1/deliveries/{delivery_id}/validate", headers=headers).status_code == 409


def test_delivery_insufficient_free_stock_enters_waiting(auth_context, db_session):
	client = auth_context["client"]
	headers = auth_context["headers"]
	inventory = db_session.scalar(
		select(Inventory).where(Inventory.product_id == PRODUCT_ID, Inventory.location_id == LOCATION_ID)
	)
	assert inventory is not None
	previous_quantity = inventory.on_hand

	created = client.post(
		"/api/v1/deliveries",
		headers=headers,
		json={
			"customer_name": "Insufficient Stock Customer",
			"source_location_id": LOCATION_ID,
			"items": [{"product_id": PRODUCT_ID, "quantity": "999999.000"}],
		},
	)
	assert created.status_code == 201
	delivery_id = created.json()["id"]
	prepared = client.post(f"/api/v1/deliveries/{delivery_id}/prepare", headers=headers)
	assert prepared.status_code == 200
	assert prepared.json()["status"] == "WAITING"

	validated = client.post(f"/api/v1/deliveries/{delivery_id}/validate", headers=headers)
	assert validated.status_code == 409
	db_session.refresh(inventory)
	current = client.get(f"/api/v1/deliveries/{delivery_id}", headers=headers)
	assert current.status_code == 200
	assert current.json()["status"] == "WAITING"
	assert inventory.on_hand == previous_quantity


def test_delivery_not_found_and_invalid_payload(auth_context):
	client = auth_context["client"]
	headers = auth_context["headers"]
	missing = "ffffffff-ffff-ffff-ffff-ffffffffffff"
	assert client.get(f"/api/v1/deliveries/{missing}", headers=headers).status_code == 404
	invalid = client.post(
		"/api/v1/deliveries",
		headers=headers,
		json={"customer_name": "Customer", "source_location_id": LOCATION_ID, "items": []},
	)
	assert invalid.status_code == 422