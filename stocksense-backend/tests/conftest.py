"""Database-backed fixtures with outer-transaction rollback isolation."""

from collections.abc import Generator
from uuid import UUID

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.api.v1.dependencies import db_session as db_session_dependency
from app.core.config import settings
from app.core.database import engine
from app.main import app


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

	def override_db_session():
		yield db_session

	app.dependency_overrides[db_session_dependency] = override_db_session
	try:
		with TestClient(app) as test_client:
			yield test_client
	finally:
		app.dependency_overrides.pop(db_session_dependency, None)


@pytest.fixture
def auth_context(client: TestClient):
	from uuid import uuid4

	email = f"phase2-{uuid4().hex}@example.test"
	response = client.post(
		"/api/v1/auth/signup",
		json={"name": "Phase Two Tester", "email": email, "password": "StrongPass@123"},
	)
	assert response.status_code == 201, response.text
	return {
		"client": client,
		"email": email,
		"headers": {"Authorization": f"Bearer {response.json()['access_token']}"},
	}