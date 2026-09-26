"""Authentication and password-reset integration tests."""

from sqlalchemy import select

from app.models import OtpCode


def test_signup_login_and_validation(client):
	email = "auth-happy@example.test"
	signup = client.post(
		"/api/v1/auth/signup",
		json={"name": "Auth Tester", "email": email, "password": "StrongPass@123"},
	)
	assert signup.status_code == 201
	assert signup.json()["token_type"] == "bearer"

	login = client.post("/api/v1/auth/login", json={"email": email, "password": "StrongPass@123"})
	assert login.status_code == 200
	assert login.json()["access_token"]

	duplicate = client.post(
		"/api/v1/auth/signup",
		json={"name": "Duplicate", "email": email, "password": "StrongPass@123"},
	)
	assert duplicate.status_code == 409

	invalid = client.post(
		"/api/v1/auth/signup",
		json={"name": "Weak", "email": "weak@example.test", "password": "weak"},
	)
	assert invalid.status_code == 422

	bad_login = client.post("/api/v1/auth/login", json={"email": email, "password": "wrong"})
	assert bad_login.status_code == 401


def test_password_reset_code_is_single_use(client, db_session):
	email = "reset-happy@example.test"
	created = client.post(
		"/api/v1/auth/signup",
		json={"name": "Reset Tester", "email": email, "password": "StrongPass@123"},
	)
	assert created.status_code == 201
	requested = client.post("/api/v1/auth/forgot-password", json={"email": email})
	assert requested.status_code == 200

	otp = db_session.scalar(select(OtpCode).order_by(OtpCode.created_at.desc()))
	assert otp is not None
	reset = client.post(
		"/api/v1/auth/reset-password",
		json={"email": email, "otp_code": otp.otp_code, "new_password": "NewStrong@456"},
	)
	assert reset.status_code == 200
	assert otp.is_used is True

	reused = client.post(
		"/api/v1/auth/reset-password",
		json={"email": email, "otp_code": otp.otp_code, "new_password": "AgainStrong@789"},
	)
	assert reused.status_code == 409
	assert client.post(
		"/api/v1/auth/login", json={"email": email, "password": "NewStrong@456"}
	).status_code == 200


def test_authentication_required_for_operations(client):
	response = client.get("/api/v1/receipts")
	assert response.status_code == 401


def test_refresh_token_rotation_and_token_type_enforcement(client):
	email = "refresh-happy@example.test"
	signup = client.post(
		"/api/v1/auth/signup",
		json={"name": "Refresh Tester", "email": email, "password": "StrongPass@123"},
	)
	assert signup.status_code == 201
	tokens = signup.json()
	refreshed = client.post("/api/v1/auth/refresh", json={"refresh_token": tokens["refresh_token"]})
	assert refreshed.status_code == 200
	pair = refreshed.json()
	assert pair["access_token"] != tokens["access_token"]
	assert pair["refresh_token"] != tokens["refresh_token"]
	protected = client.get("/api/v1/receipts", headers={"Authorization": f"Bearer {pair['access_token']}"})
	assert protected.status_code == 200

	access_as_refresh = client.post(
		"/api/v1/auth/refresh", json={"refresh_token": pair["access_token"]}
	)
	assert access_as_refresh.status_code == 401
	invalid = client.post("/api/v1/auth/refresh", json={"refresh_token": "not-a-token"})
	assert invalid.status_code == 401


def test_expired_refresh_token_rejected(client, monkeypatch):
	from datetime import datetime, timedelta, timezone
	from jose import jwt

	from app.core.config import settings

	email = "expired-refresh@example.test"
	signup = client.post(
		"/api/v1/auth/signup",
		json={"name": "Expired Tester", "email": email, "password": "StrongPass@123"},
	)
	assert signup.status_code == 201
	token_subject = jwt.decode(
		signup.json()["access_token"], settings.jwt_secret_key, algorithms=[settings.jwt_algorithm]
	)["sub"]
	expired = jwt.encode(
		{"sub": token_subject, "type": "refresh", "exp": datetime.now(timezone.utc) - timedelta(seconds=1)},
		settings.jwt_secret_key,
		algorithm=settings.jwt_algorithm,
	)
	response = client.post("/api/v1/auth/refresh", json={"refresh_token": expired})
	assert response.status_code == 401