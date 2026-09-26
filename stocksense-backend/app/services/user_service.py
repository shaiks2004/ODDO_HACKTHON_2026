"""User account operations used by authentication services."""

from sqlalchemy.orm import Session

from app.core.exceptions import ConflictError
from app.core.security import hash_password
from app.models import User
from app.repositories.user_repository import UserRepository
from app.utils.enums import UserRole


class UserService:
	def __init__(self, repository: UserRepository | None = None) -> None:
		self.repository = repository or UserRepository()

	def register(self, db: Session, *, name: str, email: str, password: str, role: UserRole = UserRole.ADMIN) -> User:
		email = email.strip().lower()
		if self.repository.get_by_email(db, email):
			raise ConflictError("Email is already registered")
		user = self.repository.create(
			db,
			name=name.strip(),
			email=email,
			password_hash=hash_password(password),
			role=role,
		)
		db.commit()
		db.refresh(user)
		return user
