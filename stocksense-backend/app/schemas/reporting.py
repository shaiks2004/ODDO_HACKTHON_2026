"""Reporting response schemas with strict Page[T] compatibility."""

from datetime import date
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.utils.enums import MovementType


class WarehouseStockValuation(BaseModel):
	model_config = ConfigDict(from_attributes=True)

	warehouse_id: UUID = Field(description="Unique warehouse identifier")
	warehouse_name: str = Field(description="Name of the warehouse")
	warehouse_code: str = Field(description="Unique code of the warehouse")
	total_products: int = Field(description="Number of distinct products in stock")
	total_quantity_on_hand: Decimal = Field(description="Sum of on-hand inventory across warehouse locations")
	total_quantity_reserved: Decimal = Field(description="Sum of reserved inventory across warehouse locations")
	total_quantity_free: Decimal = Field(description="Sum of free-to-use inventory across warehouse locations")
	total_stock_value: Decimal = Field(description="Total stock valuation in base currency")


class MovementVolumeItem(BaseModel):
	model_config = ConfigDict(from_attributes=True)

	movement_date: str = Field(description="Date of the aggregated movements (YYYY-MM-DD)")
	movement_type: MovementType = Field(description="Type of stock ledger movement")
	total_movements: int = Field(description="Count of ledger movements recorded")
	total_quantity: Decimal = Field(description="Total absolute quantity moved")


class ProductMovementVelocityItem(BaseModel):
	model_config = ConfigDict(from_attributes=True)

	product_id: UUID = Field(description="Product identifier")
	product_name: str = Field(description="Product name")
	sku: str = Field(description="Product SKU")
	category_name: str = Field(description="Category name")
	movement_count: int = Field(description="Number of ledger movements recorded")
	total_quantity_moved: Decimal = Field(description="Total absolute quantity moved in the period")
	current_on_hand: Decimal = Field(description="Total on-hand inventory across all locations")
	classification: str = Field(description="Classification: TOP_MOVING or SLOW_MOVING")
