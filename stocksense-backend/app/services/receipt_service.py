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


receipt_service = ReceiptService()