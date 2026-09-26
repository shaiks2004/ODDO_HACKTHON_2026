"""Receipt and receipt-item persistence operations."""

from collections.abc import Sequence
from uuid import UUID

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, selectinload

from app.models import Receipt, ReceiptItem


class ReceiptRepository:
	def get(self, db: Session, receipt_id: UUID) -> Receipt | None:
		return db.scalar(
			select(Receipt).options(selectinload(Receipt.items)).where(Receipt.id == receipt_id)
		)

	def list(self, db: Session, page: int, page_size: int, status=None, search: str | None = None):
		query = select(Receipt).options(selectinload(Receipt.items))
		if status is not None:
			query = query.where(Receipt.status == status)
		if search:
			term = f"%{search}%"
			query = query.where(or_(Receipt.reference.ilike(term), Receipt.supplier_name.ilike(term)))
		total = db.scalar(select(func.count()).select_from(query.order_by(None).subquery())) or 0
		rows = db.scalars(query.order_by(Receipt.created_at.desc()).offset((page - 1) * page_size).limit(page_size))
		return list(rows), total

	def create(self, db: Session, **values) -> Receipt:
		receipt = Receipt(**values)
		db.add(receipt)
		db.flush()
		return receipt

	def create_items(self, db: Session, receipt_id: UUID, items: Sequence[dict]) -> None:
		db.add_all(ReceiptItem(receipt_id=receipt_id, **item) for item in items)