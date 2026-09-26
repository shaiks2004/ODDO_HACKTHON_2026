"""Dashboard summary and advanced metrics schemas."""

from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field


class OperationBreakdown(BaseModel):
	pending: int
	late: int
	waiting: int


class ReceiptBreakdown(OperationBreakdown):
	to_receive: int


class DeliveryBreakdown(OperationBreakdown):
	to_deliver: int


class DashboardSummary(BaseModel):
	total_products_in_stock: int
	low_stock_count: int
	out_of_stock_count: int
	pending_receipts: ReceiptBreakdown
	pending_deliveries: DeliveryBreakdown
	scheduled_transfers: int
	total_stock_value: Decimal = Decimal("0.00")
	total_warehouses: int = 0
	total_locations: int = 0


class WarehouseStockKPIDetail(BaseModel):
	warehouse_id: UUID
	warehouse_name: str
	warehouse_code: str
	product_count: int
	stock_value: Decimal


class AdvancedDashboardMetrics(BaseModel):
	summary: DashboardSummary
	warehouses_breakdown: list[WarehouseStockKPIDetail]
	healthy_stock_count: int
	recent_activity_count: int
