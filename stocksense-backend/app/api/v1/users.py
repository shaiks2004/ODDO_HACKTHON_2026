"""Authenticated user profile endpoints."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.v1.auth_dependencies import get_current_user
from app.api.v1.dependencies import db_session, error
from app.core.exceptions import ConflictError
from app.models import User
from app.schemas.user import UserProfileResponse, UserProfileUpdate

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me", response_model=UserProfileResponse, summary="Get current user profile")
def get_my_profile(
    current_user: User = Depends(get_current_user),
) -> User:
    """Return the profile for the currently authenticated user."""
    return current_user


@router.patch("/me", response_model=UserProfileResponse, summary="Update current user profile")
def update_my_profile(
    payload: UserProfileUpdate,
    db: Session = Depends(db_session),
    current_user: User = Depends(get_current_user),
) -> User:
    """Update profile fields (name, email) for the currently authenticated user."""
    try:
        update_data = payload.model_dump(exclude_unset=True)
        if "email" in update_data and update_data["email"]:
            new_email = update_data["email"].strip().lower()
            if new_email != current_user.email:
                existing = db.query(User).filter(User.email == new_email).first()
                if existing:
                    raise ConflictError("Email is already registered")
                current_user.email = new_email
        if "name" in update_data and update_data["name"] is not None:
            current_user.name = update_data["name"].strip()
        db.commit()
        db.refresh(current_user)
        return current_user
    except Exception as exc:
        db.rollback()
        error(exc)
