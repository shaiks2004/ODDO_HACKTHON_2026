"""Receipt request and response schemas."""

from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.utils.enums import OperationStatus


class ReceiptItemCreate(BaseModel):
	product_id: UUID
	quantity: Decimal = Field(gt=0)


class ReceiptItemResponse(ReceiptItemCreate):
	model_config = ConfigDict(from_attributes=True)

	id: UUID
	created_at: datetime


class ReceiptCreate(BaseModel):
	supplier_name: str = Field(min_length=1, max_length=200)
	destination_location_id: UUID
	scheduled_date: datetime | None = None
	items: list[ReceiptItemCreate] = Field(min_length=1)


class ReceiptUpdate(BaseModel):
	supplier_name: str | None = Field(default=None, min_length=1, max_length=200)
	destination_location_id: UUID | None = None
	scheduled_date: datetime | None = None
	items: list[ReceiptItemCreate] | None = Field(default=None, min_length=1)


class ReceiptResponse(BaseModel):
	model_config = ConfigDict(from_attributes=True)

	id: UUID
	reference: str
	supplier_name: str
	destination_location_id: UUID
	scheduled_date: datetime | None
	status: OperationStatus
	created_by: UUID
	created_at: datetime
	updated_at: datetime
	items: list[ReceiptItemResponse]