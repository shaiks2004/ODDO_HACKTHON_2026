"""Stock adjustment persistence operations."""

from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import Adjustment, Inventory


class AdjustmentRepository:
	def inventory_for_update(self, db: Session, product_id: UUID, location_id: UUID) -> Inventory | None:
		return db.scalar(
			select(Inventory)
			.where(Inventory.product_id == product_id, Inventory.location_id == location_id)
			.with_for_update()
		)

	def get(self, db: Session, adjustment_id: UUID) -> Adjustment | None:
		return db.get(Adjustment, adjustment_id)

	def list(self, db: Session, page: int, page_size: int, status=None, product_id: UUID | None = None, search: str | None = None):
		query = select(Adjustment)
		if status is not None:
			query = query.where(Adjustment.status == status)
		if product_id is not None:
			query = query.where(Adjustment.product_id == product_id)
		if search:
			query = query.where(Adjustment.reference.ilike(f"%{search}%"))
		total = db.scalar(select(func.count()).select_from(query.order_by(None).subquery())) or 0
		rows = db.scalars(query.order_by(Adjustment.created_at.desc()).offset((page - 1) * page_size).limit(page_size))
		return list(rows), total

	def create(self, db: Session, **values) -> Adjustment:
		adjustment = Adjustment(**values)
		db.add(adjustment)
		db.flush()
		return adjustment