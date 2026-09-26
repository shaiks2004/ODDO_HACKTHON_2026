"""Authenticated user profile endpoints."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.v1.auth_dependencies import get_current_user
from app.api.v1.dependencies import db_session, error
from app.models import User
from app.schemas.user import UserProfileResponse, UserProfileUpdate
from app.services.user_service import UserService

router = APIRouter(prefix="/users", tags=["Users"])
service = UserService()


@router.get("/me", response_model=UserProfileResponse)
def get_my_profile(
	db: Session = Depends(db_session),
	user: User = Depends(get_current_user),
) -> UserProfileResponse:
	return service.get_profile(db, user)


@router.patch("/me", response_model=UserProfileResponse)
def update_my_profile(
	payload: UserProfileUpdate,
	db: Session = Depends(db_session),
	user: User = Depends(get_current_user),
) -> UserProfileResponse:
	try:
		return service.update_profile(db, user, payload.model_dump(exclude_unset=True))
	except Exception as exc:
		db.rollback()
		error(exc)