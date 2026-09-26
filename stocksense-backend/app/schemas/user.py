"""User schemas for profile operations."""

from datetime import datetime
import re
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.utils.enums import UserRole


class UserProfileResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    email: str
    role: UserRole
    is_active: bool
    created_at: datetime
    updated_at: datetime


class UserProfileUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=150)
    email: str | None = Field(default=None, min_length=3, max_length=254)

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str | None) -> str | None:
        if value is not None:
            value = value.strip().lower()
            if not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", value):
                raise ValueError("A valid email address is required")
        return value
