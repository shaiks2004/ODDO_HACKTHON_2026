from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from sqlalchemy import text

from app.api.v1.router import api_router
from app.api.v1.users import router as users_router
from app.core.database import SessionLocal, engine
from app.core.exceptions import AuthorizationError, InvalidOperationStatusError

app = FastAPI(
    title="StockSense API",
    version="1.0.0",
    description="Inventory Management System API",
)


@app.exception_handler(AuthorizationError)
def authorization_exception_handler(_request: Request, exc: AuthorizationError):
    return JSONResponse(status_code=403, content={"detail": str(exc)})


@app.exception_handler(InvalidOperationStatusError)
def invalid_operation_status_handler(_request: Request, exc: InvalidOperationStatusError):
    return JSONResponse(status_code=400, content={"detail": str(exc)})


app.include_router(api_router)
app.include_router(users_router)


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
