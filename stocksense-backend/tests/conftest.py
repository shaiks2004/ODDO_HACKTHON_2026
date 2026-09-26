"""Database-backed fixtures with outer-transaction rollback isolation."""

from collections.abc import Generator
from uuid import UUID

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.api.v1.dependencies import db_session as db_session_dependency
from app.api.v1.rate_limit import auth_limiter
from app.core.config import settings
from app.core.database import engine
from app.core.security import create_access_token, hash_password
from app.main import app
from app.models import User
from app.utils.enums import UserRole


@pytest.fixture
def db_session() -> Generator[Session, None, None]:
	if engine is None:
		pytest.skip("Set DATABASE_URL to run PostgreSQL integration tests")
	connection = engine.connect()
	outer_transaction = connection.begin()
	session = Session(
		bind=connection,
		expire_on_commit=False,
		join_transaction_mode="create_savepoint",
	)
	try:
		yield session
	finally:
		session.close()
		outer_transaction.rollback()
		connection.close()


@pytest.fixture
def client(db_session: Session, monkeypatch) -> Generator[TestClient, None, None]:
	monkeypatch.setattr(settings, "jwt_secret_key", "stocksense-test-signing-key")
	monkeypatch.setattr(
		settings,
		"stocksense_system_user_id",
		UUID("00000000-0000-0000-0000-000000000001"),
	)
	monkeypatch.setattr(settings, "auth_rate_limit", "0/minute")
	auth_limiter._events.clear()

	def override_db_session():
		yield db_session

	app.dependency_overrides[db_session_dependency] = override_db_session
	try:
		with TestClient(app) as test_client:
			yield test_client
	finally:
		app.dependency_overrides.pop(db_session_dependency, None)
		auth_limiter._events.clear()


@pytest.fixture
def auth_context(client: TestClient, db_session: Session):
	from uuid import uuid4

	email = f"phase2-{uuid4().hex}@example.test"
	user = User(
		name="Phase Two Admin",
		email=email,
		password_hash=hash_password("StrongPass@123"),
		role=UserRole.ADMIN,
		is_active=True,
	)
	db_session.add(user)
	db_session.flush()
	token = create_access_token(str(user.id))
	return {
		"client": client,
		"email": email,
		"user": user,
		"headers": {"Authorization": f"Bearer {token}"},
	}