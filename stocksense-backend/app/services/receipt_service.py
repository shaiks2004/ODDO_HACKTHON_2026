"""Receipt document workflows; stock effects belong to MovementEngine."""

from uuid import UUID, uuid4

from sqlalchemy.orm import Session

from app.core.exceptions import ConflictError, ResourceNotFoundError
from app.services.alert_service import alert_service
from app.repositories.receipt_repository import ReceiptRepository
from app.services.movement_engine import MovementEngine
from app.utils.enums import OperationStatus


class ReceiptService:
    def __init__(self, repository: ReceiptRepository | None = None, engine: MovementEngine | None = None) -> None:
        self.repository = repository or ReceiptRepository()
        self.engine = engine or MovementEngine()

    def get(self, db: Session, receipt_id: UUID):
        receipt = self.repository.get(db, receipt_id)
        if receipt is None:
            raise ResourceNotFoundError("Receipt not found")
        return receipt

    def list(self, db: Session, page: int, page_size: int, status=None, search: str | None = None):
        return self.repository.list(db, page, page_size, status, search)

    def create_receipt(self, db: Session, values: dict, created_by: UUID):
        try:
            items = values.pop("items")
            receipt = self.repository.create(
                db,
                reference=f"RCV-{uuid4().hex[:20].upper()}",
                status=OperationStatus.DRAFT,
                created_by=created_by,
                **values,
            )
            self.repository.create_items(db, receipt.id, items)
            db.commit()
            return self.get(db, receipt.id)
        except Exception:
            db.rollback()
            raise

    def validate_receipt(self, db: Session, receipt_id: UUID):
        try:
            self.engine.validate_receipt(db, receipt_id)
            receipt = self.repository.get(db, receipt_id)
            changes = [
                (item.product_id, receipt.destination_location_id) for item in receipt.items
            ]
            db.commit()
            alert_service.notify_after_stock_change(
                db, changes, operation="receipt", reference=receipt.reference
            )
            return self.get(db, receipt_id)
        except Exception:
            db.rollback()
            raise

    def cancel_receipt(self, db: Session, receipt_id: UUID):
        try:
            receipt = self.get(db, receipt_id)
            if receipt.status not in (OperationStatus.DRAFT, OperationStatus.READY):
                raise ConflictError("Receipt cannot be canceled in its current status")
            receipt.status = OperationStatus.CANCELED
            db.commit()
            return self.get(db, receipt_id)
        except Exception:
            db.rollback()
            raise

    def print_receipt(self, db: Session, receipt_id: UUID) -> str:
        receipt = self.get(db, receipt_id)
        if receipt.status != OperationStatus.DONE:
            raise ConflictError("Only completed operations can be printed")
        items_rows = "".join(
            f"<tr><td>{item.product_id}</td><td>{item.quantity}</td></tr>"
            for item in receipt.items
        )
        return f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Receipt Slip - {receipt.reference}</title>
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
    <h1>StockSense — Goods Receipt Slip</h1>
    <p>Document Reference: <strong>{receipt.reference}</strong> | Status: <span class="badge">{receipt.status.value}</span></p>
  </div>
  <div class="meta">
    <div><strong>Supplier:</strong> {receipt.supplier_name}</div>
    <div><strong>Destination Location ID:</strong> {receipt.destination_location_id}</div>
    <div><strong>Date:</strong> {receipt.updated_at.strftime('%Y-%m-%d %H:%M:%S UTC') if receipt.updated_at else ''}</div>
    <div><strong>Scheduled Date:</strong> {receipt.scheduled_date or 'N/A'}</div>
  </div>
  <table>
    <thead><tr><th>Product ID</th><th>Received Quantity</th></tr></thead>
    <tbody>{items_rows}</tbody>
  </table>
</body>
</html>"""


receipt_service = ReceiptService()