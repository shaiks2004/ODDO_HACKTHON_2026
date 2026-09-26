"""SQLAlchemy engine, declarative base, and session dependency scaffold."""

from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.core.config import settings


class Base(DeclarativeBase):
    """Base class for SQLAlchemy models."""


engine = create_engine(settings.database_url) if settings.database_url else None
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


def get_db() -> Generator[Session, None, None]:
    """Yield a database session for a request."""
    if engine is None:
        raise RuntimeError("DATABASE_URL is not configured")
    with SessionLocal() as session:
        yield session