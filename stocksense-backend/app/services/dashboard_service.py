"""Backward-compatible and advanced dashboard query orchestration."""

from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy.orm import Session

from app.repositories.dashboard_repository import DashboardRepository
from app.schemas.dashboard import (
	AdvancedDashboardSummary,
	DashboardSummary,
	DeliveryBreakdown,
	ReceiptBreakdown,
)
from app.services.inventory_service import InventoryService


class DashboardService:
	def __init__(
		self,
		inventory_service: InventoryService | None = None,
		repository: DashboardRepository | None = None,
	) -> None:
		self.inventory_service = inventory_service or InventoryService()
		self.repository = repository or DashboardRepository()

	def summary(self, db: Session, warehouse_id: UUID | None = None) -> DashboardSummary:
		rows = self.inventory_service.list(db, warehouse_id=warehouse_id)
		total_products = len({row[0].product_id for row in rows if row[0].on_hand > 0})
		low_stock = len(self.inventory_service.list(db, low_stock=True, warehouse_id=warehouse_id))
		out_of_stock = len(self.inventory_service.list(db, out_of_stock=True, warehouse_id=warehouse_id))
		counts = self.repository.operation_counts(db, datetime.now(timezone.utc), warehouse_id)
		receipt_counts = counts["receipts"]
		delivery_counts = counts["deliveries"]
		return DashboardSummary(
			total_products_in_stock=total_products,
			low_stock_count=low_stock,
			out_of_stock_count=out_of_stock,
			pending_receipts=ReceiptBreakdown(
				pending=receipt_counts["pending"],
				to_receive=receipt_counts["active"],
				late=receipt_counts["late"],
				waiting=receipt_counts["waiting"],
			),
			pending_deliveries=DeliveryBreakdown(
				pending=delivery_counts["pending"],
				to_deliver=delivery_counts["active"],
				late=delivery_counts["late"],
				waiting=delivery_counts["waiting"],
			),
			scheduled_transfers=self.repository.scheduled_transfer_count(db, warehouse_id),
		)

	def advanced_summary(self, db: Session, warehouse_id: UUID | None = None) -> AdvancedDashboardSummary:
		total_products, active_products = self.repository.product_counts(db, warehouse_id)
		stock = self.repository.inventory_totals(db, warehouse_id)
		counts = self.repository.operation_counts(db, datetime.now(timezone.utc), warehouse_id)
		return AdvancedDashboardSummary(
			total_products=total_products,
			active_products=active_products,
			low_stock_products=self.inventory_service.repo.count_distinct_products(
				db, stock_status="low_stock", warehouse_id=warehouse_id
			),
			out_of_stock_products=self.inventory_service.repo.count_distinct_products(
				db, stock_status="out_of_stock", warehouse_id=warehouse_id
			),
			**stock,
			pending_receipts=counts["receipts"]["pending"],
			late_receipts=counts["receipts"]["late"],
			waiting_receipts=counts["receipts"]["waiting"],
			pending_deliveries=counts["deliveries"]["pending"],
			late_deliveries=counts["deliveries"]["late"],
			waiting_deliveries=counts["deliveries"]["waiting"],
			scheduled_transfers=self.repository.scheduled_transfer_count(db, warehouse_id),
			ready_transfers=counts["transfers"]["active"],
			warehouses=self.repository.warehouse_totals(db, warehouse_id),
			locations=self.repository.location_totals(db, warehouse_id),
			recent_movements=self.repository.recent_movements(db, warehouse_id),
		)


dashboard_service = DashboardService()