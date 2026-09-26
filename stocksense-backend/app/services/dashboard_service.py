"""Dashboard inventory and operation summary queries."""

from datetime import datetime, timezone
from decimal import Decimal
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import Delivery, Inventory, Location, Product, Receipt, StockLedger, Transfer, Warehouse
from app.schemas.dashboard import (
	AdvancedDashboardMetrics,
	DashboardSummary,
	DeliveryBreakdown,
	ReceiptBreakdown,
	WarehouseStockKPIDetail,
)
from app.services.inventory_service import InventoryService
from app.utils.enums import OperationStatus


class DashboardService:
	def __init__(self, inventory_service: InventoryService | None = None) -> None:
		self.inventory_service = inventory_service or InventoryService()

	@staticmethod
	def _operation_counts(db: Session, model, now: datetime, location_ids: list[UUID] | None = None, is_destination: bool = False) -> dict[str, int]:
		pending = (OperationStatus.DRAFT, OperationStatus.WAITING, OperationStatus.READY)
		q_base = select(model).where(model.status.in_(pending))
		q_to_process = select(model).where(model.status.in_((OperationStatus.DRAFT, OperationStatus.READY)))
		q_late = select(model).where(model.status.in_(pending), model.scheduled_date < now)
		q_waiting = select(model).where(model.status == OperationStatus.WAITING)

		if location_ids is not None:
			loc_col = model.destination_location_id if is_destination else model.source_location_id
			q_base = q_base.where(loc_col.in_(location_ids))
			q_to_process = q_to_process.where(loc_col.in_(location_ids))
			q_late = q_late.where(loc_col.in_(location_ids))
			q_waiting = q_waiting.where(loc_col.in_(location_ids))

		pending_count = db.scalar(select(func.count()).select_from(q_base.subquery())) or 0
		to_process = db.scalar(select(func.count()).select_from(q_to_process.subquery())) or 0
		late = db.scalar(select(func.count()).select_from(q_late.subquery())) or 0
		waiting = db.scalar(select(func.count()).select_from(q_waiting.subquery())) or 0
		return {"pending": pending_count, "to_process": to_process, "late": late, "waiting": waiting}

	def summary(self, db: Session, warehouse_id: UUID | None = None) -> DashboardSummary:
		location_ids: list[UUID] | None = None
		if warehouse_id:
			loc_rows = db.scalars(select(Location.id).where(Location.warehouse_id == warehouse_id)).all()
			location_ids = list(loc_rows)

		# Distinct products in stock
		inv_q = select(func.count(func.distinct(Inventory.product_id))).where(Inventory.on_hand > 0)
		if location_ids is not None:
			inv_q = inv_q.where(Inventory.location_id.in_(location_ids))
		total_products = db.scalar(inv_q) or 0

		# Stock value
		val_q = (
			select(func.coalesce(func.sum(Inventory.on_hand * Product.unit_cost), 0))
			.select_from(Inventory)
			.join(Product, Inventory.product_id == Product.id)
		)
		if location_ids is not None:
			val_q = val_q.where(Inventory.location_id.in_(location_ids))
		total_stock_value = Decimal(str(db.scalar(val_q) or "0.00"))

		low_stock = len(self.inventory_service.list(db, low_stock=True, warehouse_id=warehouse_id))
		out_of_stock = len(self.inventory_service.list(db, out_of_stock=True, warehouse_id=warehouse_id))
		now = datetime.now(timezone.utc)

		receipt_counts = self._operation_counts(db, Receipt, now, location_ids=location_ids, is_destination=True)
		delivery_counts = self._operation_counts(db, Delivery, now, location_ids=location_ids, is_destination=False)

		transfers_q = select(func.count()).select_from(Transfer).where(
			Transfer.status.in_((OperationStatus.DRAFT, OperationStatus.READY, OperationStatus.WAITING)),
			Transfer.scheduled_date.is_not(None),
		)
		if location_ids is not None:
			transfers_q = transfers_q.where(
				(Transfer.source_location_id.in_(location_ids)) | (Transfer.destination_location_id.in_(location_ids))
			)
		scheduled_transfers = db.scalar(transfers_q) or 0

		total_warehouses = db.scalar(select(func.count()).select_from(Warehouse)) or 0
		loc_count_q = select(func.count()).select_from(Location)
		if warehouse_id:
			loc_count_q = loc_count_q.where(Location.warehouse_id == warehouse_id)
		total_locations = db.scalar(loc_count_q) or 0

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
			total_stock_value=total_stock_value,
			total_warehouses=total_warehouses,
			total_locations=total_locations,
		)

	def advanced_summary(self, db: Session, warehouse_id: UUID | None = None) -> AdvancedDashboardMetrics:
		base_summary = self.summary(db, warehouse_id)

		# Breakdown by warehouse
		wh_rows = db.execute(
			select(
				Warehouse.id,
				Warehouse.name,
				Warehouse.code,
				func.count(func.distinct(Inventory.product_id)).filter(Inventory.on_hand > 0).label("product_count"),
				func.coalesce(func.sum(Inventory.on_hand * Product.unit_cost), 0).label("stock_val"),
			)
			.select_from(Warehouse)
			.outerjoin(Location, Location.warehouse_id == Warehouse.id)
			.outerjoin(Inventory, Inventory.location_id == Location.id)
			.outerjoin(Product, Inventory.product_id == Product.id)
			.group_by(Warehouse.id, Warehouse.name, Warehouse.code)
			.order_by(Warehouse.name.asc())
		).all()

		warehouses_breakdown = [
			WarehouseStockKPIDetail(
				warehouse_id=row.id,
				warehouse_name=row.name,
				warehouse_code=row.code,
				product_count=row.product_count,
				stock_value=Decimal(str(row.stock_val or "0.00")),
			)
			for row in wh_rows
		]

		healthy_stock = db.scalar(
			select(func.count(func.distinct(Inventory.product_id)))
			.select_from(Inventory)
			.join(Product, Inventory.product_id == Product.id)
			.where(Inventory.on_hand > Product.reorder_level)
		) or 0

		recent_activity_count = db.scalar(
			select(func.count()).select_from(StockLedger)
		) or 0

		return AdvancedDashboardMetrics(
			summary=base_summary,
			warehouses_breakdown=warehouses_breakdown,
			healthy_stock_count=healthy_stock,
			recent_activity_count=recent_activity_count,
		)


dashboard_service = DashboardService()
