"""JWT and password-security helpers."""

from datetime import datetime, timedelta, timezone

from jose import jwt
from passlib.context import CryptContext

from app.core.config import settings

password_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    """Return a salted bcrypt password hash."""
    return password_context.hash(password)


def verify_password(plain_password: str, password_hash: str) -> bool:
    """Check a plaintext password against its stored hash."""
    return password_context.verify(plain_password, password_hash)


def create_access_token(subject: str) -> str:
    """Create a signed access token for a user identifier."""
    if not settings.jwt_secret_key:
        raise RuntimeError("JWT_SECRET_KEY is not configured")
    expires_at = datetime.now(timezone.utc) + timedelta(
        minutes=settings.access_token_expire_minutes
    )
    return jwt.encode(
        {"sub": subject, "exp": expires_at},
        settings.jwt_secret_key,
        algorithm=settings.jwt_algorithm,
    )