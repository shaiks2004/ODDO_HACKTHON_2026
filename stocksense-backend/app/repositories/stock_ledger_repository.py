"""Read-only stock ledger history queries."""

from datetime import datetime
from uuid import UUID

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.models import StockLedger


class StockLedgerRepository:
	def list(
		self,
		db: Session,
		page: int,
		page_size: int,
		product_id: UUID | None = None,
		location_id: UUID | None = None,
		movement_type=None,
		date_from: datetime | None = None,
		date_to: datetime | None = None,
		reference_id: UUID | None = None,
	):
		query = select(StockLedger)
		if product_id is not None:
			query = query.where(StockLedger.product_id == product_id)
		if location_id is not None:
			query = query.where(
				or_(StockLedger.source_location_id == location_id, StockLedger.destination_location_id == location_id)
			)
		if movement_type is not None:
			query = query.where(StockLedger.movement_type == movement_type)
		if date_from is not None:
			query = query.where(StockLedger.created_at >= date_from)
		if date_to is not None:
			query = query.where(StockLedger.created_at <= date_to)
		if reference_id is not None:
			query = query.where(StockLedger.reference_id == reference_id)
		total = db.scalar(select(func.count()).select_from(query.order_by(None).subquery())) or 0
		rows = db.scalars(query.order_by(StockLedger.created_at.desc(), StockLedger.id.desc()).offset((page - 1) * page_size).limit(page_size))
		return list(rows), total