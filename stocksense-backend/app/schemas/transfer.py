"""Transfer request and response schemas."""

from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.utils.enums import OperationStatus


class TransferItemCreate(BaseModel):
	product_id: UUID
	quantity: Decimal = Field(gt=0)


class TransferItemResponse(TransferItemCreate):
	model_config = ConfigDict(from_attributes=True)

	id: UUID
	created_at: datetime


class TransferCreate(BaseModel):
	source_location_id: UUID
	destination_location_id: UUID
	scheduled_date: datetime | None = None
	items: list[TransferItemCreate] = Field(min_length=1)

	@model_validator(mode="after")
	def validate_locations(self):
		if self.source_location_id == self.destination_location_id:
			raise ValueError("Source and destination locations must differ")
		return self


class TransferResponse(BaseModel):
	model_config = ConfigDict(from_attributes=True)

	id: UUID
	reference: str
	source_location_id: UUID
	destination_location_id: UUID
	scheduled_date: datetime | None
	status: OperationStatus
	created_by: UUID
	created_at: datetime
	updated_at: datetime
	items: list[TransferItemResponse]