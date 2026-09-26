"""Delivery request and response schemas."""

from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.utils.enums import OperationStatus


class DeliveryItemCreate(BaseModel):
	product_id: UUID
	quantity: Decimal = Field(gt=0)


class DeliveryItemResponse(DeliveryItemCreate):
	model_config = ConfigDict(from_attributes=True)

	id: UUID
	created_at: datetime


class DeliveryCreate(BaseModel):
	customer_name: str = Field(min_length=1, max_length=200)
	source_location_id: UUID
	scheduled_date: datetime | None = None
	items: list[DeliveryItemCreate] = Field(min_length=1)


class DeliveryUpdate(BaseModel):
	customer_name: str | None = Field(default=None, min_length=1, max_length=200)
	source_location_id: UUID | None = None
	scheduled_date: datetime | None = None
	items: list[DeliveryItemCreate] | None = Field(default=None, min_length=1)


class DeliveryResponse(BaseModel):
	model_config = ConfigDict(from_attributes=True)

	id: UUID
	reference: str
	customer_name: str
	source_location_id: UUID
	scheduled_date: datetime | None
	status: OperationStatus
	created_by: UUID
	created_at: datetime
	updated_at: datetime
	items: list[DeliveryItemResponse]