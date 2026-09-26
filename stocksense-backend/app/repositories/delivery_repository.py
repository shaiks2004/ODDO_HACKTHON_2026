"""Delivery and delivery-item persistence operations."""

from collections.abc import Sequence
from uuid import UUID

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, selectinload

from app.models import Delivery, DeliveryItem


class DeliveryRepository:
	def get(self, db: Session, delivery_id: UUID) -> Delivery | None:
		return db.scalar(
			select(Delivery).options(selectinload(Delivery.items)).where(Delivery.id == delivery_id)
		)

	def list(self, db: Session, page: int, page_size: int, status=None, search: str | None = None):
		query = select(Delivery).options(selectinload(Delivery.items))
		if status is not None:
			query = query.where(Delivery.status == status)
		if search:
			term = f"%{search}%"
			query = query.where(or_(Delivery.reference.ilike(term), Delivery.customer_name.ilike(term)))
		total = db.scalar(select(func.count()).select_from(query.order_by(None).subquery())) or 0
		rows = db.scalars(query.order_by(Delivery.created_at.desc()).offset((page - 1) * page_size).limit(page_size))
		return list(rows), total

	def create(self, db: Session, **values) -> Delivery:
		delivery = Delivery(**values)
		db.add(delivery)
		db.flush()
		return delivery

	def create_items(self, db: Session, delivery_id: UUID, items: Sequence[dict]) -> None:
		db.add_all(DeliveryItem(delivery_id=delivery_id, **item) for item in items)