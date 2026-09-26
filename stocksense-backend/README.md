# StockSense Backend

FastAPI 1.0 foundation for StockSense, using SQLAlchemy 2.x and the existing PostgreSQL 18 database `Oddo_Hackthon`. This phase contains database configuration, read-only ORM mappings, initial Pydantic schemas, API versioning, and health checks only. Business endpoints and stock workflows are intentionally not implemented.

## Setup

From `stocksense-backend/`:

```powershell
python -m venv venv
venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
```

Set a real, URL-encoded connection string in `.env`; never commit that file:

```dotenv
DATABASE_URL=postgresql+psycopg://<user>:<url-encoded-password>@localhost:5432/Oddo_Hackthon
JWT_SECRET_KEY=replace-with-a-long-random-secret
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

The existing database is the source of truth. The API performs no schema DDL and no Alembic migration should be generated in this phase. The separate SQL initialization files are in `database/`.

## Running and testing

```powershell
uvicorn app.main:app --reload
python -m pytest
```

Swagger is available at `http://127.0.0.1:8000/docs`. `GET /health` reports service status; `GET /health/db` performs a read-only `SELECT 1` connection check. `tests/test_database.py` checks that the seeded product data is visible without modifying the database.

## Database architecture

The mapped tables are `users`, `otp_codes`, `categories`, `products`, `warehouses`, `locations`, `inventory`, `receipts`, `receipt_items`, `deliveries`, `delivery_items`, `transfers`, `transfer_items`, `adjustments`, and `stock_ledger`.

Categories own products; warehouses own locations; inventory joins a product to a location. Receipt, delivery, transfer, adjustment, and ledger records are mapped with their actual foreign-key relationships. Inventory free-to-use remains a calculated value: `on_hand - reserved`.
