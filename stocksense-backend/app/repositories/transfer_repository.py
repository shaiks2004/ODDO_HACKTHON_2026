"""Transfer and transfer-item persistence operations."""

from collections.abc import Sequence
from uuid import UUID

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, selectinload

from app.models import Transfer, TransferItem


class TransferRepository:
	def get(self, db: Session, transfer_id: UUID) -> Transfer | None:
		return db.scalar(select(Transfer).options(selectinload(Transfer.items)).where(Transfer.id == transfer_id))

	def list(self, db: Session, page: int, page_size: int, status=None, search: str | None = None):
		query = select(Transfer).options(selectinload(Transfer.items))
		if status is not None:
			query = query.where(Transfer.status == status)
		if search:
			query = query.where(Transfer.reference.ilike(f"%{search}%"))
		total = db.scalar(select(func.count()).select_from(query.order_by(None).subquery())) or 0
		rows = db.scalars(query.order_by(Transfer.created_at.desc()).offset((page - 1) * page_size).limit(page_size))
		return list(rows), total

	def create(self, db: Session, **values) -> Transfer:
		transfer = Transfer(**values)
		db.add(transfer)
		db.flush()
		return transfer

	def create_items(self, db: Session, transfer_id: UUID, items: Sequence[dict]) -> None:
		db.add_all(TransferItem(transfer_id=transfer_id, **item) for item in items)