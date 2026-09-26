"""Backward-compatible and advanced dashboard response schemas."""

from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.schemas.stock_ledger import StockLedgerResponse


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


class DashboardWarehouseTotal(BaseModel):
	warehouse_id: UUID
	warehouse_name: str
	location_count: int
	product_count: int
	on_hand: Decimal
	reserved: Decimal
	free_to_use: Decimal
	stock_value: Decimal


class DashboardLocationTotal(BaseModel):
	location_id: UUID
	location_name: str
	location_code: str
	warehouse_id: UUID
	warehouse_name: str
	product_count: int
	on_hand: Decimal
	reserved: Decimal
	free_to_use: Decimal
	stock_value: Decimal


class AdvancedDashboardSummary(BaseModel):
	total_products: int
	active_products: int
	low_stock_products: int
	out_of_stock_products: int
	total_on_hand: Decimal
	total_reserved: Decimal
	total_free_to_use: Decimal
	total_stock_value: Decimal
	pending_receipts: int
	late_receipts: int
	waiting_receipts: int
	pending_deliveries: int
	late_deliveries: int
	waiting_deliveries: int
	scheduled_transfers: int
	ready_transfers: int
	warehouses: list[DashboardWarehouseTotal]
	locations: list[DashboardLocationTotal]
	recent_movements: list[StockLedgerResponse]