"""Low-stock alert and post-commit notification tests."""

from decimal import Decimal

from sqlalchemy import select

from app.core.config import settings
from app.models import Inventory
from app.services.alert_service import alert_service

CARTRIDGE_ID = "40000000-0000-0000-0000-000000000012"
STEEL_ID = "40000000-0000-0000-0000-000000000001"
MAIN_LOCATION_ID = "30000000-0000-0000-0000-000000000001"


def test_low_stock_alert_returns_reorder_data_and_filters(auth_context):
    client = auth_context["client"]
    headers = auth_context["headers"]
    response = client.get("/api/v1/alerts/low-stock", headers=headers)
    assert response.status_code == 200, response.text
    cartridge = next(row for row in response.json() if row["product_id"] == CARTRIDGE_ID)
    assert cartridge["stock_status"] == "low_stock"
    assert Decimal(cartridge["on_hand"]) == Decimal("5.000")
    assert Decimal(cartridge["reorder_quantity"]) == Decimal("30.000")
    assert Decimal(cartridge["suggested_reorder_quantity"]) == Decimal("30.000")
    assert Decimal(cartridge["free_to_use"]) == Decimal("5.000")

    filtered = client.get(
        f"/api/v1/alerts/low-stock?product_id={CARTRIDGE_ID}&location_id={MAIN_LOCATION_ID}",
        headers=headers,
    )
    assert filtered.status_code == 200
    assert len(filtered.json()) == 1
    assert filtered.json()[0]["product_id"] == CARTRIDGE_ID


def test_out_of_stock_alert_uses_existing_row_without_creating_rows(auth_context, db_session):
    client = auth_context["client"]
    headers = auth_context["headers"]
    inventory = db_session.scalar(
        select(Inventory).where(
            Inventory.product_id == STEEL_ID,
            Inventory.location_id == MAIN_LOCATION_ID,
        )
    )
    assert inventory is not None
    inventory.on_hand = Decimal("0")
    inventory.reserved = Decimal("0")
    db_session.commit()

    response = client.get(
        f"/api/v1/alerts/low-stock?product_id={STEEL_ID}&location_id={MAIN_LOCATION_ID}",
        headers=headers,
    )
    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["stock_status"] == "out_of_stock"
    assert response.json()[0]["suggested_reorder_quantity"] == "1000.000"


def test_failed_notification_does_not_undo_committed_receipt(auth_context, db_session, monkeypatch):
    client = auth_context["client"]
    headers = auth_context["headers"]
    inventory = db_session.scalar(
        select(Inventory).where(
            Inventory.product_id == CARTRIDGE_ID,
            Inventory.location_id == MAIN_LOCATION_ID,
        )
    )
    previous = inventory.on_hand
    monkeypatch.setattr(settings, "stocksense_alert_webhook_url", "https://invalid.example/webhook")

    def fail_webhook(*_args):
        raise OSError("simulated webhook failure")

    monkeypatch.setattr(alert_service, "_send_webhook", fail_webhook)
    created = client.post(
        "/api/v1/receipts",
        headers=headers,
        json={
            "supplier_name": "Alert Failure Test",
            "destination_location_id": MAIN_LOCATION_ID,
            "items": [{"product_id": CARTRIDGE_ID, "quantity": "1.000"}],
        },
    )
    assert created.status_code == 201
    validated = client.post(f"/api/v1/receipts/{created.json()['id']}/validate", headers=headers)
    assert validated.status_code == 200
    assert validated.json()["status"] == "DONE"
    db_session.refresh(inventory)
    assert inventory.on_hand == previous + Decimal("1.000")