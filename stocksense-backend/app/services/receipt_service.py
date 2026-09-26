"""Receipt document workflows; stock effects belong to MovementEngine."""

from uuid import UUID, uuid4

from sqlalchemy.orm import Session

from app.core.exceptions import ConflictError, ResourceNotFoundError
from app.repositories.receipt_repository import ReceiptRepository
from app.services.movement_engine import MovementEngine
from app.services.print_service import print_service
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
            db.commit()
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

    def render_print_document(self, db: Session, receipt_id: UUID) -> str:
        receipt = self.get(db, receipt_id)
        return print_service.render_receipt(receipt)


receipt_service = ReceiptService()
