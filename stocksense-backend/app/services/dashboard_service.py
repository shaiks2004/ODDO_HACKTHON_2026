"""Dashboard inventory and operation summary queries."""

from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import Delivery, Inventory, Receipt, Transfer
from app.services.inventory_service import InventoryService
from app.utils.enums import OperationStatus
from app.schemas.dashboard import DashboardSummary, DeliveryBreakdown, ReceiptBreakdown


class DashboardService:
	def __init__(self, inventory_service: InventoryService | None = None) -> None:
		self.inventory_service = inventory_service or InventoryService()

	@staticmethod
	def _operation_counts(db: Session, model, now: datetime) -> dict[str, int]:
		pending = (OperationStatus.DRAFT, OperationStatus.WAITING, OperationStatus.READY)
		pending_count = db.scalar(select(func.count()).select_from(model).where(model.status.in_(pending))) or 0
		to_process = db.scalar(
			select(func.count()).select_from(model).where(model.status.in_((OperationStatus.DRAFT, OperationStatus.READY)))
		) or 0
		late = db.scalar(
			select(func.count()).select_from(model).where(model.status.in_(pending), model.scheduled_date < now)
		) or 0
		waiting = db.scalar(
			select(func.count()).select_from(model).where(model.status == OperationStatus.WAITING)
		) or 0
		return {"pending": pending_count, "to_process": to_process, "late": late, "waiting": waiting}

	def summary(self, db: Session) -> DashboardSummary:
		total_products = db.scalar(
			select(func.count(func.distinct(Inventory.product_id))).where(Inventory.on_hand > 0)
		) or 0
		low_stock = len(self.inventory_service.list(db, low_stock=True))
		out_of_stock = len(self.inventory_service.list(db, out_of_stock=True))
		now = datetime.now(timezone.utc)
		receipt_counts = self._operation_counts(db, Receipt, now)
		delivery_counts = self._operation_counts(db, Delivery, now)
		scheduled_transfers = db.scalar(
			select(func.count()).select_from(Transfer).where(
				Transfer.status.in_((OperationStatus.DRAFT, OperationStatus.READY, OperationStatus.WAITING)),
				Transfer.scheduled_date.is_not(None),
			)
		) or 0
		return DashboardSummary(
			total_products_in_stock=total_products,
			low_stock_count=low_stock,
			out_of_stock_count=out_of_stock,
			pending_receipts=ReceiptBreakdown(
				pending=receipt_counts["pending"],
				to_receive=receipt_counts["to_process"],
				late=receipt_counts["late"],
				waiting=receipt_counts["waiting"],
			),
			pending_deliveries=DeliveryBreakdown(
				pending=delivery_counts["pending"],
				to_deliver=delivery_counts["to_process"],
				late=delivery_counts["late"],
				waiting=delivery_counts["waiting"],
			),
			scheduled_transfers=scheduled_transfers,
		)


dashboard_service = DashboardService()