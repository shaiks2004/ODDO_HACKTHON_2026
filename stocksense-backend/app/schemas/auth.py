"""Authentication request and response schemas."""

import re

from pydantic import AliasChoices, BaseModel, ConfigDict, Field, field_validator


class SignupRequest(BaseModel):
	model_config = ConfigDict(extra="forbid")

	name: str = Field(min_length=1, max_length=150)
	email: str = Field(min_length=3, max_length=254)
	password: str = Field(min_length=8, max_length=72)

	@field_validator("email")
	@classmethod
	def validate_email(cls, value: str) -> str:
		value = value.strip().lower()
		if not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", value):
			raise ValueError("A valid email address is required")
		return value

	@field_validator("password")
	@classmethod
	def validate_password(cls, value: str) -> str:
		if not all((re.search(r"[a-z]", value), re.search(r"[A-Z]", value),
					re.search(r"\d", value), re.search(r"[^A-Za-z0-9]", value))):
			raise ValueError("Password must include lowercase, uppercase, numeric, and special characters")
		return value


class SignupResponse(BaseModel):
	message: str = "Account created. Please verify your email with the OTP code sent."
	email: str
	requires_verification: bool = True


class VerifyOtpRequest(BaseModel):
	email: str = Field(min_length=3, max_length=254)
	otp_code: str = Field(min_length=4, max_length=20)

	@field_validator("email")
	@classmethod
	def validate_email(cls, value: str) -> str:
		value = value.strip().lower()
		if not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", value):
			raise ValueError("A valid email address is required")
		return value


VerifySignupRequest = VerifyOtpRequest


class ResendOtpRequest(BaseModel):
	email: str = Field(min_length=3, max_length=254)

	@field_validator("email")
	@classmethod
	def validate_email(cls, value: str) -> str:
		value = value.strip().lower()
		if not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", value):
			raise ValueError("A valid email address is required")
		return value


class LoginRequest(BaseModel):
	email: str = Field(min_length=3, max_length=254, validation_alias=AliasChoices("email", "login"))
	password: str = Field(min_length=1, max_length=72)


class LoginOtpRequest(BaseModel):
	email: str = Field(min_length=3, max_length=254)
	password: str = Field(min_length=1, max_length=72)

	@field_validator("email")
	@classmethod
	def validate_email(cls, value: str) -> str:
		value = value.strip().lower()
		if not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", value):
			raise ValueError("A valid email address is required")
		return value


VerifyLoginOtpRequest = VerifyOtpRequest


class TokenResponse(BaseModel):
	access_token: str
	token_type: str = "bearer"
	refresh_token: str | None = None


class RefreshRequest(BaseModel):
	refresh_token: str = Field(min_length=1)


class ForgotPasswordRequest(BaseModel):
	email: str = Field(min_length=3, max_length=254)

	@field_validator("email")
	@classmethod
	def validate_email(cls, value: str) -> str:
		value = value.strip().lower()
		if not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", value):
			raise ValueError("A valid email address is required")
		return value


class ResetPasswordRequest(BaseModel):
	email: str = Field(min_length=3, max_length=254)
	otp_code: str = Field(min_length=4, max_length=20)
	new_password: str = Field(min_length=8, max_length=72)

	@field_validator("email")
	@classmethod
	def validate_email(cls, value: str) -> str:
		value = value.strip().lower()
		if not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", value):
			raise ValueError("A valid email address is required")
		return value

	@field_validator("new_password")
	@classmethod
	def validate_password(cls, value: str) -> str:
		if not all((re.search(r"[a-z]", value), re.search(r"[A-Z]", value),
					re.search(r"\d", value), re.search(r"[^A-Za-z0-9]", value))):
			raise ValueError("Password must include lowercase, uppercase, numeric, and special characters")
		return value


class AuthUserResponse(BaseModel):
	model_config = ConfigDict(from_attributes=True)

	id: str
	name: str
	email: str