"""Authentication and password-reset workflows."""

import secrets
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.exceptions import ConflictError, UnauthorizedOperationError
from app.core.security import create_access_token, hash_password, verify_password
from app.models import User
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

	def signup(self, db: Session, *, name: str, email: str, password: str) -> str:
		if not settings.jwt_secret_key:
			raise RuntimeError("JWT_SECRET_KEY is not configured")
		user = self.user_service.register(db, name=name, email=email, password=password)
		return create_access_token(str(user.id))

	def login(self, db: Session, *, email: str, password: str) -> str:
		user = self.repository.get_by_email(db, email.strip().lower())
		if not user or not user.is_active or not verify_password(password, user.password_hash):
			raise UnauthorizedOperationError("Invalid email or password")
		return create_access_token(str(user.id))

	def request_password_reset(self, db: Session, email: str) -> None:
		user = self.repository.get_by_email(db, email.strip().lower())
		if user is None:
			return
		otp_code = f"{secrets.randbelow(1_000_000):06d}"
		expires_at = datetime.now(timezone.utc) + timedelta(minutes=settings.otp_expire_minutes)
		self.repository.create_otp(db, user.id, otp_code, expires_at)
		db.commit()

	def reset_password(self, db: Session, *, email: str, otp_code: str, new_password: str) -> None:
		user = self.repository.get_by_email(db, email.strip().lower())
		now = datetime.now(timezone.utc)
		otp = self.repository.get_valid_otp(db, user.id, otp_code, now) if user else None
		if otp is None or user is None:
			raise ConflictError("Invalid or expired password reset code")
		try:
			user.password_hash = hash_password(new_password)
			otp.is_used = True
			db.commit()
		except Exception:
			db.rollback()
			raise


auth_service = AuthService()