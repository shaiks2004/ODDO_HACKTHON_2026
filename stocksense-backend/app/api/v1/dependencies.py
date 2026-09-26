from collections.abc import Generator
from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError
from app.core.database import get_db
from app.core.exceptions import (
    AuthorizationError,
    ConflictError,
    InvalidOperationStatusError,
    ResourceNotFoundError,
)

def db_session() -> Generator: yield from get_db()
def error(exc: Exception) -> None:
    if isinstance(exc, ResourceNotFoundError): raise HTTPException(404, str(exc))
    if isinstance(exc, ConflictError): raise HTTPException(409, str(exc))
    if isinstance(exc, AuthorizationError): raise HTTPException(403, str(exc))
    if isinstance(exc, InvalidOperationStatusError): raise HTTPException(400, str(exc))
    if isinstance(exc, IntegrityError): raise HTTPException(409, 'A record with one of these unique values already exists')
    raise exc
