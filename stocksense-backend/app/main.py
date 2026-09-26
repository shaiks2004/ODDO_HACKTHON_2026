"""FastAPI application entry point."""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.database import SessionLocal, engine

app = FastAPI(
    title="StockSense API",
    version="1.0.0",
    description="Inventory Management System API",
)
app.include_router(api_router)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)


@app.get("/health", tags=["system"])
def health_check() -> dict[str, str]:
    """Return a minimal service health response."""
    return {"status": "ok", "service": "StockSense API"}


@app.get("/health/db", tags=["system"])
def database_health_check() -> dict[str, str]:
    """Verify the configured database can execute a read-only lightweight query."""
    if engine is None:
        raise HTTPException(status_code=503, detail="DATABASE_URL is not configured")
    try:
        with SessionLocal() as session:
            session.execute(text("SELECT 1"))
        return {"status": "ok", "database": "connected"}
    except Exception as exc:
        raise HTTPException(status_code=503, detail="Database connection unavailable") from exc
