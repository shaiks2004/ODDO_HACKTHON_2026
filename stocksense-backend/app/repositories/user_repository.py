"""User and password-reset persistence operations."""

from datetime import datetime
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import OtpCode, User


class UserRepository:
	def get_by_email(self, db: Session, email: str) -> User | None:
		return db.scalar(select(User).where(User.email == email.strip().lower()))

	def get_by_id(self, db: Session, user_id: UUID | str) -> User | None:
		return db.get(User, user_id)

	def email_in_use(self, db: Session, email: str, excluding_user_id=None) -> bool:
		query = select(User.id).where(User.email == email.strip().lower())
		if excluding_user_id is not None:
			query = query.where(User.id != excluding_user_id)
		return db.scalar(query) is not None

	def create(self, db: Session, **values) -> User:
		user = User(**values)
		db.add(user)
		db.flush()
		return user

	def create_otp(self, db: Session, user_id: UUID | str, otp_code: str, expires_at: datetime) -> OtpCode:
		otp = OtpCode(user_id=user_id, otp_code=otp_code, expires_at=expires_at, is_used=False)
		db.add(otp)
		db.flush()
		return otp

	def get_valid_otp(self, db: Session, user_id: UUID | str, otp_code: str, now: datetime) -> OtpCode | None:
		return db.scalar(
			select(OtpCode).where(
				OtpCode.user_id == user_id,
				OtpCode.otp_code == otp_code,
				OtpCode.is_used.is_(False),
				OtpCode.expires_at > now,
			).order_by(OtpCode.expires_at.desc(), OtpCode.created_at.desc())
		)

	def get_latest_otp(self, db: Session, user_id: UUID | str, otp_code: str) -> OtpCode | None:
		return db.scalar(
			select(OtpCode).where(
				OtpCode.user_id == user_id,
				OtpCode.otp_code == otp_code,
			).order_by(OtpCode.is_used.asc(), OtpCode.expires_at.desc(), OtpCode.created_at.desc())
		)