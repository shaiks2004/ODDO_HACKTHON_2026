"""Authentication, OTP verification, and password-reset workflows."""

import secrets
from datetime import datetime, timedelta, timezone
from uuid import UUID

from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.exceptions import ConflictError, UnauthorizedOperationError
from app.core.security import create_access_token, create_refresh_token, hash_password, verify_password
from app.repositories.user_repository import UserRepository
from app.services.user_service import UserService


class AuthService:
	def __init__(
		self,
		repository: UserRepository | None = None,
		user_service: UserService | None = None,
	) -> None:
		self.repository = repository or UserRepository()
		self.user_service = user_service or UserService(self.repository)

	@staticmethod
	def _token_pair(user_id: UUID) -> dict[str, str]:
		subject = str(user_id)
		return {
			"access_token": create_access_token(subject),
			"token_type": "bearer",
			"refresh_token": create_refresh_token(subject),
		}

	@staticmethod
	def _generate_otp_code() -> str:
		return f"{secrets.randbelow(1_000_000):06d}"

	def signup(self, db: Session, *, name: str, email: str, password: str) -> dict[str, object]:
		if not settings.jwt_secret_key:
			raise RuntimeError("JWT_SECRET_KEY is not configured")
		user = self.user_service.register(db, name=name, email=email, password=password)
		otp_code = self._generate_otp_code()
		expires_at = datetime.now(timezone.utc) + timedelta(minutes=settings.otp_expire_minutes)
		self.repository.create_otp(db, user.id, otp_code, expires_at)
		db.commit()
		return {
			"message": "Account created. Please verify your email with the OTP code sent.",
			"email": user.email,
			"requires_verification": True,
		}

	def verify_signup(self, db: Session, *, email: str, otp_code: str) -> dict[str, str]:
		user = self.repository.get_by_email(db, email.strip().lower())
		if user is None:
			raise ConflictError("Invalid verification code")
		now = datetime.now(timezone.utc)
		otp = self.repository.get_latest_otp(db, user.id, otp_code.strip())
		if otp is None:
			raise ConflictError("Invalid verification code")
		if otp.is_used:
			raise ConflictError("Verification code has already been used")
		if otp.expires_at <= now:
			raise ConflictError("Verification code has expired")

		otp.is_used = True
		user.is_active = True
		db.commit()
		return self._token_pair(user.id)

	def resend_otp(self, db: Session, *, email: str) -> dict[str, str]:
		user = self.repository.get_by_email(db, email.strip().lower())
		if user is not None:
			otp_code = self._generate_otp_code()
			expires_at = datetime.now(timezone.utc) + timedelta(minutes=settings.otp_expire_minutes)
			self.repository.create_otp(db, user.id, otp_code, expires_at)
			db.commit()
		return {"message": "A new verification code has been issued."}

	def login(self, db: Session, *, email: str, password: str) -> dict[str, str]:
		user = self.repository.get_by_email(db, email.strip().lower())
		if not user or not verify_password(password, user.password_hash):
			raise UnauthorizedOperationError("Invalid email or password")
		if not user.is_active:
			raise UnauthorizedOperationError("Account is not verified. Please verify your account with OTP.")
		return self._token_pair(user.id)

	def request_login_otp(self, db: Session, *, email: str, password: str) -> dict[str, str]:
		user = self.repository.get_by_email(db, email.strip().lower())
		if not user or not verify_password(password, user.password_hash):
			raise UnauthorizedOperationError("Invalid email or password")
		if not user.is_active:
			raise UnauthorizedOperationError("Account is not verified. Please verify your account with OTP.")
		otp_code = self._generate_otp_code()
		expires_at = datetime.now(timezone.utc) + timedelta(minutes=settings.otp_expire_minutes)
		self.repository.create_otp(db, user.id, otp_code, expires_at)
		db.commit()
		return {"message": "Login verification code has been issued.", "email": user.email}

	def verify_login_otp(self, db: Session, *, email: str, otp_code: str) -> dict[str, str]:
		user = self.repository.get_by_email(db, email.strip().lower())
		if user is None:
			raise UnauthorizedOperationError("Invalid login verification code")
		now = datetime.now(timezone.utc)
		otp = self.repository.get_latest_otp(db, user.id, otp_code.strip())
		if otp is None:
			raise ConflictError("Invalid verification code")
		if otp.is_used:
			raise ConflictError("Verification code has already been used")
		if otp.expires_at <= now:
			raise ConflictError("Verification code has expired")

		otp.is_used = True
		db.commit()
		return self._token_pair(user.id)

	def refresh(self, db: Session, refresh_token: str) -> dict[str, str]:
		try:
			payload = jwt.decode(
				refresh_token,
				settings.jwt_secret_key,
				algorithms=[settings.jwt_algorithm],
			)
			if payload.get("type") != "refresh":
				raise ValueError("Not a refresh token")
			user_id = UUID(payload["sub"])
		except (JWTError, KeyError, TypeError, ValueError):
			raise UnauthorizedOperationError("Invalid refresh token")
		user = self.repository.get_by_id(db, user_id)
		if user is None or not user.is_active:
			raise UnauthorizedOperationError("Invalid refresh token")
		return self._token_pair(user.id)

	def request_password_reset(self, db: Session, email: str) -> None:
		user = self.repository.get_by_email(db, email.strip().lower())
		if user is None:
			return
		otp_code = self._generate_otp_code()
		expires_at = datetime.now(timezone.utc) + timedelta(minutes=settings.otp_expire_minutes)
		self.repository.create_otp(db, user.id, otp_code, expires_at)
		db.commit()

	def reset_password(self, db: Session, *, email: str, otp_code: str, new_password: str) -> None:
		user = self.repository.get_by_email(db, email.strip().lower())
		if user is None:
			raise ConflictError("Invalid or expired password reset code")
		now = datetime.now(timezone.utc)
		otp = self.repository.get_latest_otp(db, user.id, otp_code.strip())
		if otp is None:
			raise ConflictError("Invalid or expired password reset code")
		if otp.is_used:
			raise ConflictError("Password reset code has already been used")
		if otp.expires_at <= now:
			raise ConflictError("Password reset code has expired")

		try:
			user.password_hash = hash_password(new_password)
			otp.is_used = True
			db.commit()
		except Exception:
			db.rollback()
			raise


auth_service = AuthService()