"""FastAPI application entry point."""

from fastapi import FastAPI

app = FastAPI(
    title="StockSense API",
    version="0.1.0",
    description="Inventory management API scaffold.",
)


@app.get("/health", tags=["system"])
def health_check() -> dict[str, str]:
    """Return a minimal service health response."""
    return {"status": "ok"}