"""Low-stock queries and best-effort post-commit alert notifications."""

import json
import logging
from decimal import Decimal
from urllib.request import Request, urlopen
from uuid import UUID

from sqlalchemy.orm import Session

from app.core.config import settings
from app.services.inventory_service import InventoryService

logger = logging.getLogger(__name__)


class AlertService:
    def __init__(self, inventory_service: InventoryService | None = None) -> None:
        self.inventory_service = inventory_service or InventoryService()

    @staticmethod
    def _as_alert(row) -> dict:
        inventory, product, _category, location, warehouse = row
        is_out = inventory.on_hand == 0
        shortfall = max(Decimal("0"), product.reorder_level - inventory.on_hand)
        return {
            "product_id": product.id,
            "product_name": product.name,
            "sku": product.sku,
            "location_id": location.id,
            "location_name": location.name,
            "location_code": location.code,
            "warehouse_id": warehouse.id,
            "warehouse_name": warehouse.name,
            "on_hand": inventory.on_hand,
            "reserved": inventory.reserved,
            "free_to_use": inventory.on_hand - inventory.reserved,
            "reorder_level": product.reorder_level,
            "reorder_quantity": product.reorder_quantity,
            "suggested_reorder_quantity": max(product.reorder_quantity, shortfall),
            "stock_status": "out_of_stock" if is_out else "low_stock",
        }

    def low_stock(self, db: Session, **filters) -> list[dict]:
        low_rows = self.inventory_service.list(db, low_stock=True, **filters)
        out_rows = self.inventory_service.list(db, out_of_stock=True, **filters)
        by_key = {(row[0].product_id, row[0].location_id): row for row in (*low_rows, *out_rows)}
        alerts = [self._as_alert(row) for row in by_key.values() if row[0].on_hand <= row[1].reorder_level]
        return sorted(alerts, key=lambda item: (item["sku"], item["location_code"]))

    def notify_after_stock_change(
        self,
        db: Session,
        changes: list[tuple[UUID, UUID]],
        *,
        operation: str,
        reference: str,
    ) -> None:
        try:
            deduplicated = set(changes)
            for product_id, location_id in deduplicated:
                alerts = self.low_stock(db, product_id=product_id, location_id=location_id)
                for alert in alerts:
                    logger.warning(
                        "StockSense low-stock alert operation=%s reference=%s sku=%s location=%s status=%s",
                        operation,
                        reference,
                        alert["sku"],
                        alert["location_code"],
                        alert["stock_status"],
                    )
                    self._send_webhook(alert, operation, reference)
        except Exception:
            logger.exception("Failed to evaluate StockSense alerts after committed stock movement")

    @staticmethod
    def _send_webhook(alert: dict, operation: str, reference: str) -> None:
        webhook_url = settings.stocksense_alert_webhook_url
        if not webhook_url:
            return
        body = json.dumps({"text": f"Stock alert: {alert['sku']} at {alert['location_code']} is {alert['stock_status']} (operation {operation}, reference {reference})."}).encode()
        request = Request(webhook_url, data=body, headers={"Content-Type": "application/json"}, method="POST")
        try:
            with urlopen(request, timeout=2):
                pass
        except Exception:
            logger.exception("StockSense alert webhook delivery failed")


alert_service = AlertService()