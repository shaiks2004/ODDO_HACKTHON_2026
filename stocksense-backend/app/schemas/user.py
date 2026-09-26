"""Safe authenticated user profile schemas."""

from uuid import UUID

import re

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from app.utils.enums import UserRole


class UserProfileUpdate(BaseModel):
	model_config = ConfigDict(extra="forbid")

	name: str | None = Field(default=None, min_length=1, max_length=150)
	email: str | None = Field(default=None, min_length=3, max_length=254)

	@field_validator("name")
	@classmethod
	def strip_name(cls, value: str | None) -> str | None:
		return value.strip() if value is not None else None

	@field_validator("email")
	@classmethod
	def normalize_email(cls, value: str | None) -> str | None:
		if value is None:
			return None
		value = value.strip().lower()
		if not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", value):
			raise ValueError("A valid email address is required")
		return value

	@model_validator(mode="after")
	def require_change(self):
		if not self.model_fields_set:
			raise ValueError("At least one profile field must be provided")
		return self


class UserProfileResponse(BaseModel):
	model_config = ConfigDict(from_attributes=True)

	id: UUID
	name: str
	email: str
	role: UserRole