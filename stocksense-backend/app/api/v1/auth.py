"""Public signup, login, OTP verification, and password reset endpoints."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.v1.dependencies import db_session, error
from app.api.v1.rate_limit import limit_auth_request
from app.core.exceptions import UnauthorizedOperationError
from app.schemas.auth import (
	ForgotPasswordRequest,
	LoginOtpRequest,
	LoginRequest,
	RefreshRequest,
	ResendOtpRequest,
	ResetPasswordRequest,
	SignupRequest,
	SignupResponse,
	TokenResponse,
	VerifyLoginOtpRequest,
	VerifyOtpRequest,
	VerifySignupRequest,
)
from app.services.auth_service import auth_service

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/signup", response_model=SignupResponse, status_code=status.HTTP_201_CREATED, dependencies=[Depends(limit_auth_request)])
def signup(payload: SignupRequest, db: Session = Depends(db_session)) -> SignupResponse:
	try:
		return SignupResponse(**auth_service.signup(db, **payload.model_dump()))
	except Exception as exc:
		db.rollback()
		error(exc)


@router.post("/verify-signup", response_model=TokenResponse, dependencies=[Depends(limit_auth_request)])
def verify_signup(payload: VerifySignupRequest, db: Session = Depends(db_session)) -> TokenResponse:
	try:
		return TokenResponse(**auth_service.verify_signup(db, **payload.model_dump()))
	except UnauthorizedOperationError as exc:
		raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc), headers={"WWW-Authenticate": "Bearer"})
	except Exception as exc:
		db.rollback()
		error(exc)


@router.post("/verify-otp", response_model=TokenResponse, dependencies=[Depends(limit_auth_request)])
def verify_otp(payload: VerifyOtpRequest, db: Session = Depends(db_session)) -> TokenResponse:
	try:
		return TokenResponse(**auth_service.verify_signup(db, **payload.model_dump()))
	except UnauthorizedOperationError as exc:
		raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc), headers={"WWW-Authenticate": "Bearer"})
	except Exception as exc:
		db.rollback()
		error(exc)


@router.post("/resend-otp", dependencies=[Depends(limit_auth_request)])
def resend_otp(payload: ResendOtpRequest, db: Session = Depends(db_session)) -> dict[str, str]:
	try:
		return auth_service.resend_otp(db, email=payload.email)
	except Exception as exc:
		db.rollback()
		error(exc)


@router.post("/login", response_model=TokenResponse, dependencies=[Depends(limit_auth_request)])
def login(payload: LoginRequest, db: Session = Depends(db_session)) -> TokenResponse:
	try:
		return TokenResponse(**auth_service.login(db, **payload.model_dump()))
	except UnauthorizedOperationError as exc:
		raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc), headers={"WWW-Authenticate": "Bearer"})
	except Exception as exc:
		db.rollback()
		error(exc)


@router.post("/login-otp", dependencies=[Depends(limit_auth_request)])
def login_otp(payload: LoginOtpRequest, db: Session = Depends(db_session)) -> dict[str, str]:
	try:
		return auth_service.request_login_otp(db, **payload.model_dump())
	except UnauthorizedOperationError as exc:
		raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc), headers={"WWW-Authenticate": "Bearer"})
	except Exception as exc:
		db.rollback()
		error(exc)


@router.post("/verify-login-otp", response_model=TokenResponse, dependencies=[Depends(limit_auth_request)])
def verify_login_otp(payload: VerifyLoginOtpRequest, db: Session = Depends(db_session)) -> TokenResponse:
	try:
		return TokenResponse(**auth_service.verify_login_otp(db, **payload.model_dump()))
	except UnauthorizedOperationError as exc:
		raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc), headers={"WWW-Authenticate": "Bearer"})
	except Exception as exc:
		db.rollback()
		error(exc)


@router.post("/forgot-password", dependencies=[Depends(limit_auth_request)])
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(db_session)) -> dict[str, str]:
	try:
		auth_service.request_password_reset(db, payload.email)
		return {"message": "If the account exists, a reset code has been issued."}
	except Exception as exc:
		db.rollback()
		error(exc)


@router.post("/reset-password", dependencies=[Depends(limit_auth_request)])
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(db_session)) -> dict[str, str]:
	try:
		auth_service.reset_password(db, **payload.model_dump())
		return {"message": "Password has been reset."}
	except Exception as exc:
		db.rollback()
		error(exc)


@router.post("/refresh", response_model=TokenResponse)
def refresh(payload: RefreshRequest, db: Session = Depends(db_session)) -> TokenResponse:
	try:
		return TokenResponse(**auth_service.refresh(db, payload.refresh_token))
	except UnauthorizedOperationError as exc:
		raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc), headers={"WWW-Authenticate": "Bearer"})
	except Exception as exc:
		db.rollback()
		error(exc)