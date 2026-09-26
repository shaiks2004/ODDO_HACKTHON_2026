"""Dashboard summary schemas."""

from pydantic import BaseModel


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