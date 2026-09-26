"""Authenticated-user dependency for protected Phase 2 operations."""

from collections.abc import Callable
from uuid import UUID

from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.api.v1.dependencies import db_session
from app.core.config import settings
from app.core.exceptions import AuthorizationError
from app.models import User
from app.utils.enums import UserRole

bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(db_session),
) -> User:
    if credentials is None or not settings.jwt_secret_key:
        raise HTTPException(status_code=401, detail="Not authenticated", headers={"WWW-Authenticate": "Bearer"})
    try:
        subject = jwt.decode(
            credentials.credentials,
            settings.jwt_secret_key,
            algorithms=[settings.jwt_algorithm],
        ).get("sub")
        user_id = UUID(subject)
    except (JWTError, TypeError, ValueError):
        raise HTTPException(status_code=401, detail="Invalid authentication credentials", headers={"WWW-Authenticate": "Bearer"})
    user = db.get(User, user_id)
    if user is None or not user.is_active:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials", headers={"WWW-Authenticate": "Bearer"})
    return user


def require_role(*allowed_roles: UserRole) -> Callable:
    """Dependency factory checking that current user has one of allowed_roles."""

    def role_dependency(user: User = Depends(get_current_user)) -> User:
        if user.role not in allowed_roles:
            raise AuthorizationError(f"User role '{user.role}' is not authorized to perform this operation")
        return user

    return role_dependency
