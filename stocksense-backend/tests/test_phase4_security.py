"""Authentication throttling and CORS hardening tests."""

from app.api.v1.rate_limit import auth_limiter
from app.core.config import Settings, settings


def test_auth_rate_limits_login_forgot_and_reset(client, monkeypatch):
    monkeypatch.setattr(settings, "auth_rate_limit", "1/minute")
    auth_limiter._events.clear()

    login_body = {"email": "missing@example.test", "password": "bad"}
    assert client.post("/api/v1/auth/login", json=login_body).status_code == 401
    limited = client.post("/api/v1/auth/login", json=login_body)
    assert limited.status_code == 429
    assert limited.headers["retry-after"]

    forgot_body = {"email": "missing@example.test"}
    assert client.post("/api/v1/auth/forgot-password", json=forgot_body).status_code == 200
    assert client.post("/api/v1/auth/forgot-password", json=forgot_body).status_code == 429

    reset_body = {
        "email": "missing@example.test",
        "otp_code": "123456",
        "new_password": "StrongPass@123",
    }
    assert client.post("/api/v1/auth/reset-password", json=reset_body).status_code == 409
    assert client.post("/api/v1/auth/reset-password", json=reset_body).status_code == 429


def test_limiter_can_be_disabled_for_test_configuration(client, monkeypatch):
    monkeypatch.setattr(settings, "auth_rate_limit", "0/minute")
    auth_limiter._events.clear()
    body = {"email": "missing@example.test", "password": "bad"}
    assert client.post("/api/v1/auth/login", json=body).status_code == 401
    assert client.post("/api/v1/auth/login", json=body).status_code == 401


def test_cors_allows_configured_dev_origin_and_rejects_other_origin(client):
    allowed = client.options(
        "/api/v1/products",
        headers={"Origin": "http://localhost:3000", "Access-Control-Request-Method": "GET"},
    )
    assert allowed.status_code == 200
    assert allowed.headers["access-control-allow-origin"] == "http://localhost:3000"

    denied = client.options(
        "/api/v1/products",
        headers={"Origin": "https://untrusted.example", "Access-Control-Request-Method": "GET"},
    )
    assert "access-control-allow-origin" not in denied.headers


def test_production_cors_defaults_closed():
    production = Settings(_env_file=None, environment="production", cors_allowed_origins="")
    assert production.allowed_cors_origins == []