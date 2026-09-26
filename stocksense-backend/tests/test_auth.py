"""Authentication, OTP verification, and password-reset integration tests."""

from datetime import datetime, timedelta, timezone
from jose import jwt
from sqlalchemy import select

from app.core.config import settings
from app.models import OtpCode, User


def test_signup_requires_otp_verification_before_login(client, db_session):
	email = "signup-otp@example.test"
	signup = client.post(
		"/api/v1/auth/signup",
		json={"name": "Signup Tester", "email": email, "password": "StrongPass@123"},
	)
	assert signup.status_code == 201
	data = signup.json()
	assert data["requires_verification"] is True
	assert data["email"] == email

	# Unverified account cannot log in directly
	unverified_login = client.post(
		"/api/v1/auth/login",
		json={"email": email, "password": "StrongPass@123"},
	)
	assert unverified_login.status_code == 401
	assert "not verified" in unverified_login.json()["detail"].lower()

	# Duplicate email registration rejected
	duplicate = client.post(
		"/api/v1/auth/signup",
		json={"name": "Duplicate Tester", "email": email, "password": "StrongPass@123"},
	)
	assert duplicate.status_code == 409

	# Invalid schema fields (e.g. attempting to pass role)
	role_attempt = client.post(
		"/api/v1/auth/signup",
		json={"name": "Attacker", "email": "attacker@example.test", "password": "StrongPass@123", "role": "ADMIN"},
	)
	assert role_attempt.status_code == 422

	# Retrieve OTP code from database
	db_session.expire_all()
	user = db_session.scalar(select(User).where(User.email == email))
	otp = db_session.scalar(
		select(OtpCode)
		.where(OtpCode.user_id == user.id, OtpCode.is_used.is_(False))
		.order_by(OtpCode.expires_at.desc())
	)
	assert otp is not None
	assert otp.is_used is False

	# Wrong OTP rejected
	bad_otp = client.post(
		"/api/v1/auth/verify-signup",
		json={"email": email, "otp_code": "000000"},
	)
	assert bad_otp.status_code == 409

	# Verify with valid OTP
	verified = client.post(
		"/api/v1/auth/verify-signup",
		json={"email": email, "otp_code": otp.otp_code},
	)
	assert verified.status_code == 200
	tokens = verified.json()
	assert tokens["access_token"]
	assert tokens["refresh_token"]

	# OTP cannot be reused
	reused = client.post(
		"/api/v1/auth/verify-signup",
		json={"email": email, "otp_code": otp.otp_code},
	)
	assert reused.status_code == 409

	# Now verified user can log in
	login = client.post(
		"/api/v1/auth/login",
		json={"email": email, "password": "StrongPass@123"},
	)
	assert login.status_code == 200
	assert login.json()["access_token"]


def test_signup_otp_expiration(client, db_session):
	email = "expired-otp@example.test"
	signup = client.post(
		"/api/v1/auth/signup",
		json={"name": "Expired Tester", "email": email, "password": "StrongPass@123"},
	)
	assert signup.status_code == 201

	db_session.expire_all()
	user = db_session.scalar(select(User).where(User.email == email))
	otp = db_session.scalar(
		select(OtpCode)
		.where(OtpCode.user_id == user.id, OtpCode.is_used.is_(False))
		.order_by(OtpCode.expires_at.desc())
	)
	assert otp is not None

	# Manually expire the OTP
	otp.expires_at = datetime.now(timezone.utc) - timedelta(minutes=5)
	db_session.commit()

	expired_res = client.post(
		"/api/v1/auth/verify-signup",
		json={"email": email, "otp_code": otp.otp_code},
	)
	assert expired_res.status_code == 409
	assert "expired" in expired_res.json()["detail"].lower()

	# Resend OTP
	resend = client.post("/api/v1/auth/resend-otp", json={"email": email})
	assert resend.status_code == 200

	db_session.expire_all()
	new_otp = db_session.scalar(
		select(OtpCode)
		.where(OtpCode.user_id == user.id, OtpCode.is_used.is_(False))
		.order_by(OtpCode.expires_at.desc())
	)
	assert new_otp is not None
	assert new_otp.id != otp.id

	# Verify with the new OTP via /verify-otp alias
	verified = client.post(
		"/api/v1/auth/verify-otp",
		json={"email": email, "otp_code": new_otp.otp_code},
	)
	assert verified.status_code == 200
	assert verified.json()["access_token"]


def test_login_otp_workflow(client, db_session):
	email = "login-otp@example.test"
	signup = client.post(
		"/api/v1/auth/signup",
		json={"name": "Login OTP Tester", "email": email, "password": "StrongPass@123"},
	)
	assert signup.status_code == 201
	db_session.expire_all()
	user = db_session.scalar(select(User).where(User.email == email))
	signup_otp = db_session.scalar(
		select(OtpCode)
		.where(OtpCode.user_id == user.id, OtpCode.is_used.is_(False))
		.order_by(OtpCode.expires_at.desc())
	)
	client.post("/api/v1/auth/verify-signup", json={"email": email, "otp_code": signup_otp.otp_code})

	# Request login OTP
	login_req = client.post(
		"/api/v1/auth/login-otp",
		json={"email": email, "password": "StrongPass@123"},
	)
	assert login_req.status_code == 200
	assert login_req.json()["email"] == email

	# Invalid credentials for login OTP request
	bad_login_req = client.post(
		"/api/v1/auth/login-otp",
		json={"email": email, "password": "WrongPassword@999"},
	)
	assert bad_login_req.status_code == 401

	db_session.expire_all()
	login_otp = db_session.scalar(
		select(OtpCode)
		.where(OtpCode.user_id == user.id, OtpCode.is_used.is_(False))
		.order_by(OtpCode.expires_at.desc())
	)
	assert login_otp is not None
	assert login_otp.is_used is False

	# Verify login OTP with invalid code
	bad_verify = client.post(
		"/api/v1/auth/verify-login-otp",
		json={"email": email, "otp_code": "999999"},
	)
	assert bad_verify.status_code == 409

	# Verify login OTP with valid code
	verify_res = client.post(
		"/api/v1/auth/verify-login-otp",
		json={"email": email, "otp_code": login_otp.otp_code},
	)
	assert verify_res.status_code == 200
	assert verify_res.json()["access_token"]

	# Verify login OTP is single use
	reused_verify = client.post(
		"/api/v1/auth/verify-login-otp",
		json={"email": email, "otp_code": login_otp.otp_code},
	)
	assert reused_verify.status_code == 409


def test_password_reset_code_is_single_use(client, db_session):
	email = "reset-happy@example.test"
	signup = client.post(
		"/api/v1/auth/signup",
		json={"name": "Reset Tester", "email": email, "password": "StrongPass@123"},
	)
	assert signup.status_code == 201
	db_session.expire_all()
	user = db_session.scalar(select(User).where(User.email == email))
	signup_otp = db_session.scalar(
		select(OtpCode)
		.where(OtpCode.user_id == user.id, OtpCode.is_used.is_(False))
		.order_by(OtpCode.expires_at.desc())
	)
	client.post("/api/v1/auth/verify-signup", json={"email": email, "otp_code": signup_otp.otp_code})

	requested = client.post("/api/v1/auth/forgot-password", json={"email": email})
	assert requested.status_code == 200

	db_session.expire_all()
	reset_otp = db_session.scalar(
		select(OtpCode)
		.where(OtpCode.user_id == user.id, OtpCode.is_used.is_(False))
		.order_by(OtpCode.expires_at.desc())
	)
	assert reset_otp is not None
	reset = client.post(
		"/api/v1/auth/reset-password",
		json={"email": email, "otp_code": reset_otp.otp_code, "new_password": "NewStrong@456"},
	)
	assert reset.status_code == 200
	db_session.expire_all()
	db_session.refresh(reset_otp)
	assert reset_otp.is_used is True

	reused = client.post(
		"/api/v1/auth/reset-password",
		json={"email": email, "otp_code": reset_otp.otp_code, "new_password": "AgainStrong@789"},
	)
	assert reused.status_code == 409
	assert client.post(
		"/api/v1/auth/login", json={"email": email, "password": "NewStrong@456"}
	).status_code == 200


def test_authentication_required_for_operations(client):
	response = client.get("/api/v1/receipts")
	assert response.status_code == 401


def test_refresh_token_rotation_and_token_type_enforcement(client, db_session):
	email = "refresh-happy@example.test"
	signup = client.post(
		"/api/v1/auth/signup",
		json={"name": "Refresh Tester", "email": email, "password": "StrongPass@123"},
	)
	assert signup.status_code == 201
	db_session.expire_all()
	user = db_session.scalar(select(User).where(User.email == email))
	otp = db_session.scalar(
		select(OtpCode)
		.where(OtpCode.user_id == user.id, OtpCode.is_used.is_(False))
		.order_by(OtpCode.expires_at.desc())
	)
	verified = client.post("/api/v1/auth/verify-signup", json={"email": email, "otp_code": otp.otp_code})
	assert verified.status_code == 200
	tokens = verified.json()

	refreshed = client.post("/api/v1/auth/refresh", json={"refresh_token": tokens["refresh_token"]})
	assert refreshed.status_code == 200
	pair = refreshed.json()
	assert pair["access_token"] != tokens["access_token"]
	assert pair["refresh_token"] != tokens["refresh_token"]

	protected = client.get("/api/v1/users/me", headers={"Authorization": f"Bearer {pair['access_token']}"})
	assert protected.status_code == 200

	access_as_refresh = client.post(
		"/api/v1/auth/refresh", json={"refresh_token": pair["access_token"]}
	)
	assert access_as_refresh.status_code == 401
	invalid = client.post("/api/v1/auth/refresh", json={"refresh_token": "not-a-token"})
	assert invalid.status_code == 401


def test_expired_refresh_token_rejected(client, db_session):
	email = "expired-refresh@example.test"
	signup = client.post(
		"/api/v1/auth/signup",
		json={"name": "Expired Tester", "email": email, "password": "StrongPass@123"},
	)
	assert signup.status_code == 201
	db_session.expire_all()
	user = db_session.scalar(select(User).where(User.email == email))
	otp = db_session.scalar(
		select(OtpCode)
		.where(OtpCode.user_id == user.id, OtpCode.is_used.is_(False))
		.order_by(OtpCode.expires_at.desc())
	)
	verified = client.post("/api/v1/auth/verify-signup", json={"email": email, "otp_code": otp.otp_code})
	assert verified.status_code == 200

	token_subject = jwt.decode(
		verified.json()["access_token"], settings.jwt_secret_key, algorithms=[settings.jwt_algorithm]
	)["sub"]
	expired = jwt.encode(
		{"sub": token_subject, "type": "refresh", "exp": datetime.now(timezone.utc) - timedelta(seconds=1)},
		settings.jwt_secret_key,
		algorithm=settings.jwt_algorithm,
	)
	response = client.post("/api/v1/auth/refresh", json={"refresh_token": expired})
	assert response.status_code == 401