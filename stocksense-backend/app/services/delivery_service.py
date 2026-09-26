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


delivery_service = DeliveryService()