"""Reusable role-based authorization dependencies."""

from collections.abc import Callable

from fastapi import Depends, HTTPException

from app.api.v1.auth_dependencies import get_current_user
from app.models import User
from app.utils.enums import UserRole


def require_roles(*roles: UserRole) -> Callable[..., User]:
    allowed = frozenset(roles)

    def dependency(user: User = Depends(get_current_user)) -> User:
        if user.role not in allowed:
            permitted = ", ".join(role.value for role in roles)
            raise HTTPException(status_code=403, detail=f"This operation requires one of these roles: {permitted}")
        return user

    return dependency


require_inventory_management = require_roles(UserRole.ADMIN, UserRole.INVENTORY_MANAGER)