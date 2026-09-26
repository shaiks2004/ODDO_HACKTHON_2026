"""Read-only integration checks for the existing StockSense database."""

from sqlalchemy import text

from app.core.database import SessionLocal, engine
from app.models import Product


def test_database_connection_and_seed_visibility() -> None:
    assert engine is not None, "Set DATABASE_URL before running integration tests."
    with SessionLocal() as session:
        assert session.execute(text("SELECT 1")).scalar_one() == 1
        assert session.query(Product).count() >= 1
        assert session.query(Product).filter_by(sku="SS-STEEL-001").one().name == "Steel Rods"
