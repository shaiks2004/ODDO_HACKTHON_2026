"""Stock adjustment workflow with engine-owned stock validation."""

from decimal import Decimal
from uuid import UUID, uuid4

from sqlalchemy.orm import Session

from app.core.exceptions import ConflictError, ResourceNotFoundError
from app.repositories.adjustment_repository import AdjustmentRepository
from app.services.movement_engine import MovementEngine
from app.utils.enums import OperationStatus


class AdjustmentService:
    def __init__(self, repository: AdjustmentRepository | None = None, engine: MovementEngine | None = None) -> None:
        self.repository = repository or AdjustmentRepository()
        self.engine = engine or MovementEngine()

    def get(self, db: Session, adjustment_id: UUID):
        adjustment = self.repository.get(db, adjustment_id)
        if adjustment is None:
            raise ResourceNotFoundError("Adjustment not found")
        return adjustment

    def list(self, db: Session, page: int, page_size: int, status=None, product_id: UUID | None = None, search: str | None = None):
        return self.repository.list(db, page, page_size, status, product_id, search)

    def create_adjustment(self, db: Session, values: dict, created_by: UUID):
        try:
            inventory = self.repository.inventory_for_update(
                db, values["product_id"], values["location_id"]
            )
            system_quantity = inventory.on_hand if inventory else Decimal("0")
            physical_quantity = values["physical_quantity"]
            if inventory and physical_quantity < inventory.reserved:
                raise ConflictError("Physical quantity cannot be less than reserved quantity")
            adjustment = self.repository.create(
                db,
                reference=f"ADJ-{uuid4().hex[:20].upper()}",
                system_quantity=system_quantity,
                difference=physical_quantity - system_quantity,
                status=OperationStatus.DRAFT,
                created_by=created_by,
                **values,
            )
            db.commit()
            return self.get(db, adjustment.id)
        except Exception:
            db.rollback()
            raise

    def validate_adjustment(self, db: Session, adjustment_id: UUID):
        try:
            self.engine.validate_adjustment(db, adjustment_id)
            db.commit()
            return self.get(db, adjustment_id)
        except Exception:
            db.rollback()
            raise


adjustment_service = AdjustmentService()