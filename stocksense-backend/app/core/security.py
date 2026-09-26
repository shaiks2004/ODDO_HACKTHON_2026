"""JWT and password-security extension points."""


def hash_password(password: str) -> str:
    """Placeholder for secure password hashing."""
    raise NotImplementedError


def verify_password(plain_password: str, password_hash: str) -> bool:
    """Placeholder for password verification."""
    raise NotImplementedError


def create_access_token(subject: str) -> str:
    """Placeholder for JWT creation."""
    raise NotImplementedError