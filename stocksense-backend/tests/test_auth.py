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