"""Public signup, login, and password reset endpoints."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.v1.dependencies import db_session, error
from app.core.exceptions import UnauthorizedOperationError
from app.schemas.auth import (
	ForgotPasswordRequest,
	LoginRequest,
	ResetPasswordRequest,
	SignupRequest,
	TokenResponse,
)
from app.services.auth_service import auth_service

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/signup", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def signup(payload: SignupRequest, db: Session = Depends(db_session)) -> TokenResponse:
	try:
		return TokenResponse(access_token=auth_service.signup(db, **payload.model_dump()))
	except Exception as exc:
		db.rollback()
		error(exc)


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(db_session)) -> TokenResponse:
	try:
		return TokenResponse(access_token=auth_service.login(db, **payload.model_dump()))
	except UnauthorizedOperationError as exc:
		raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc), headers={"WWW-Authenticate": "Bearer"})
	except Exception as exc:
		db.rollback()
		error(exc)


@router.post("/forgot-password")
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(db_session)) -> dict[str, str]:
	try:
		auth_service.request_password_reset(db, payload.email)
		return {"message": "If the account exists, a reset code has been issued."}
	except Exception as exc:
		db.rollback()
		error(exc)


@router.post("/reset-password")
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(db_session)) -> dict[str, str]:
	try:
		auth_service.reset_password(db, **payload.model_dump())
		return {"message": "Password has been reset."}
	except Exception as exc:
		db.rollback()
		error(exc)