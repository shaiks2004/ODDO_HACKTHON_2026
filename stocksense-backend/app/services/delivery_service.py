"""Delivery document workflows delegated to MovementEngine for stock checks."""

from uuid import UUID, uuid4

from sqlalchemy.orm import Session

from app.core.exceptions import ConflictError, ResourceNotFoundError
from app.services.alert_service import alert_service
from app.repositories.delivery_repository import DeliveryRepository
from app.services.movement_engine import MovementEngine
from app.utils.enums import OperationStatus


class DeliveryService:
    def __init__(self, repository: DeliveryRepository | None = None, engine: MovementEngine | None = None) -> None:
        self.repository = repository or DeliveryRepository()
        self.engine = engine or MovementEngine()

    def get(self, db: Session, delivery_id: UUID):
        delivery = self.repository.get(db, delivery_id)
        if delivery is None:
            raise ResourceNotFoundError("Delivery not found")
        return delivery

    def list(self, db: Session, page: int, page_size: int, status=None, search: str | None = None):
        return self.repository.list(db, page, page_size, status, search)

    def create_delivery(self, db: Session, values: dict, created_by: UUID):
        try:
            items = values.pop("items")
            delivery = self.repository.create(
                db,
                reference=f"OUT-{uuid4().hex[:20].upper()}",
                status=OperationStatus.DRAFT,
                created_by=created_by,
                **values,
            )
            self.repository.create_items(db, delivery.id, items)
            db.commit()
            return self.get(db, delivery.id)
        except Exception:
            db.rollback()
            raise

    def check_availability(self, db: Session, delivery_id: UUID) -> bool:
        return self.engine.check_delivery_availability(db, delivery_id)

    def prepare_delivery(self, db: Session, delivery_id: UUID):
        try:
            delivery = self.get(db, delivery_id)
            if delivery.status not in (OperationStatus.DRAFT, OperationStatus.READY, OperationStatus.WAITING):
                raise ConflictError("Delivery cannot be prepared in its current status")
            delivery.status = (
                OperationStatus.READY
                if self.check_availability(db, delivery_id)
                else OperationStatus.WAITING
            )
            db.commit()
            return self.get(db, delivery_id)
        except Exception:
            db.rollback()
            raise

    def validate_delivery(self, db: Session, delivery_id: UUID):
        try:
            self.engine.validate_delivery(db, delivery_id)
            delivery = self.repository.get(db, delivery_id)
            changes = (
                [(item.product_id, delivery.source_location_id) for item in delivery.items]
                if delivery.status == OperationStatus.DONE
                else []
            )
            db.commit()
            if changes:
                alert_service.notify_after_stock_change(
                    db, changes, operation="delivery", reference=delivery.reference
                )
            return self.get(db, delivery_id)
        except Exception:
            db.rollback()
            raise

    def cancel_delivery(self, db: Session, delivery_id: UUID):
        try:
            delivery = self.get(db, delivery_id)
            if delivery.status not in (OperationStatus.DRAFT, OperationStatus.READY, OperationStatus.WAITING):
                raise ConflictError("Delivery cannot be canceled in its current status")
            delivery.status = OperationStatus.CANCELED
            db.commit()
            return self.get(db, delivery_id)
        except Exception:
            db.rollback()
            raise

    def print_delivery(self, db: Session, delivery_id: UUID) -> str:
        delivery = self.get(db, delivery_id)
        if delivery.status != OperationStatus.DONE:
            raise ConflictError("Only completed operations can be printed")
        items_rows = "".join(
            f"<tr><td>{item.product_id}</td><td>{item.quantity}</td></tr>"
            for item in delivery.items
        )
        return f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Delivery Order - {delivery.reference}</title>
  <style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 40px; color: #171923; }}
    .header {{ border-bottom: 2px solid #6D5BD0; padding-bottom: 16px; margin-bottom: 24px; }}
    h1 {{ margin: 0 0 8px; color: #6D5BD0; font-size: 24px; }}
    .meta {{ display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 24px; }}
    table {{ width: 100%; border-collapse: collapse; margin-top: 16px; }}
    th, td {{ padding: 10px 12px; text-align: left; border-bottom: 1px solid #D9DDE5; }}
    th {{ background: #F3F4F6; font-weight: 600; color: #4B5563; }}
    .badge {{ display: inline-block; padding: 4px 8px; background: #D1FAE5; color: #065F46; border-radius: 4px; font-weight: 600; }}
  </style>
</head>
<body>
  <div class="header">
    <h1>StockSense — Outbound Delivery Order</h1>
    <p>Document Reference: <strong>{delivery.reference}</strong> | Status: <span class="badge">{delivery.status.value}</span></p>
  </div>
  <div class="meta">
    <div><strong>Customer:</strong> {delivery.customer_name}</div>
    <div><strong>Source Location ID:</strong> {delivery.source_location_id}</div>
    <div><strong>Date:</strong> {delivery.updated_at.strftime('%Y-%m-%d %H:%M:%S UTC') if delivery.updated_at else ''}</div>
    <div><strong>Scheduled Date:</strong> {delivery.scheduled_date or 'N/A'}</div>
  </div>
  <table>
    <thead><tr><th>Product ID</th><th>Delivered Quantity</th></tr></thead>
    <tbody>{items_rows}</tbody>
  </table>
</body>
</html>"""


delivery_service = DeliveryService()