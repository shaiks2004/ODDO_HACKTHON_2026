"""Internal transfer documents delegated to MovementEngine for stock effects."""

from uuid import UUID, uuid4

from sqlalchemy.orm import Session

from app.core.exceptions import ConflictError, ResourceNotFoundError
from app.repositories.transfer_repository import TransferRepository
from app.services.movement_engine import MovementEngine
from app.utils.enums import OperationStatus


class TransferService:
    def __init__(self, repository: TransferRepository | None = None, engine: MovementEngine | None = None) -> None:
        self.repository = repository or TransferRepository()
        self.engine = engine or MovementEngine()

    def get(self, db: Session, transfer_id: UUID):
        transfer = self.repository.get(db, transfer_id)
        if transfer is None:
            raise ResourceNotFoundError("Transfer not found")
        return transfer

    def list(self, db: Session, page: int, page_size: int, status=None, search: str | None = None):
        return self.repository.list(db, page, page_size, status, search)

    def create_transfer(self, db: Session, values: dict, created_by: UUID):
        try:
            items = values.pop("items")
            transfer = self.repository.create(
                db,
                reference=f"TRF-{uuid4().hex[:20].upper()}",
                status=OperationStatus.DRAFT,
                created_by=created_by,
                **values,
            )
            self.repository.create_items(db, transfer.id, items)
            db.commit()
            return self.get(db, transfer.id)
        except Exception:
            db.rollback()
            raise

    def validate_transfer(self, db: Session, transfer_id: UUID):
        try:
            self.engine.validate_transfer(db, transfer_id)
            db.commit()
            return self.get(db, transfer_id)
        except Exception:
            db.rollback()
            raise

    def cancel_transfer(self, db: Session, transfer_id: UUID):
        try:
            transfer = self.get(db, transfer_id)
            if transfer.status not in (OperationStatus.DRAFT, OperationStatus.READY):
                raise ConflictError("Transfer cannot be canceled in its current status")
            transfer.status = OperationStatus.CANCELED
            db.commit()
            return self.get(db, transfer_id)
        except Exception:
            db.rollback()
            raise


transfer_service = TransferService()