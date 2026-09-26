# StockSense Backend

FastAPI inventory backend using SQLAlchemy 2.x and PostgreSQL 18. The existing `Oddo_Hackthon` schema is frozen; application startup does not create or migrate tables.

## Setup

From `stocksense-backend/`:

```powershell
python -m venv venv
venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
```

Set a real, URL-encoded connection string and a generated JWT secret in `.env`; never commit that file:

```dotenv
DATABASE_URL=postgresql+psycopg://<user>:<url-encoded-password>@localhost:5432/Oddo_Hackthon
JWT_SECRET_KEY=<long-random-secret>
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=14
OTP_EXPIRE_MINUTES=10
STOCKSENSE_SYSTEM_USER_ID=00000000-0000-0000-0000-000000000001
CORS_ALLOWED_ORIGINS=http://localhost:3000
AUTH_RATE_LIMIT=5/minute
```

Use the existing database credentials in `DATABASE_URL`; do not put a database password in source control. `STOCKSENSE_SYSTEM_USER_ID` must identify an existing user for ledger movements. Password reset codes are persisted but no email/SMS delivery provider is configured yet.

## Running and testing

```powershell
uvicorn app.main:app --reload
python -m pytest
```

Swagger is available at `http://127.0.0.1:8000/docs`. `GET /health` reports service status; `GET /health/db` performs a read-only `SELECT 1` connection check. `tests/test_database.py` checks that the seeded product data is visible without modifying the database.

## API Foundation

Phase 1 catalog and inventory endpoints and Phase 2 authentication, stock workflows, ledger, and dashboard remain available. Phase 4 adds low-stock alerts, typed/rotating refresh JWTs, authentication rate limiting, explicit-origin CORS, and deployment support. Low-stock alerts reuse the inventory query semantics; optional webhook failures cannot roll back stock operations.

CSV export routes use a streaming provider adapter intended for the Phase 3 reporting service. Phase 3 report implementations are not present in this checkout, so exports return `503` until that provider is integrated. No parallel report queries are implemented here.

Run all tests with `python -m pytest`. PostgreSQL integration tests require a configured `.env`; test fixtures wrap each test in an outer transaction and roll it back after the test.

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for Compose startup, clean-database initialization, environment hardening, health checks, and security notes. `docker compose up` never runs schema or seed SQL automatically. Generated OpenAPI and Postman artifacts are under `docs/`.

## Database architecture

The mapped tables are `users`, `otp_codes`, `categories`, `products`, `warehouses`, `locations`, `inventory`, `receipts`, `receipt_items`, `deliveries`, `delivery_items`, `transfers`, `transfer_items`, `adjustments`, and `stock_ledger`.

Categories own products; warehouses own locations; inventory joins a product to a location. Receipt, delivery, transfer, adjustment, and ledger records are mapped with their actual foreign-key relationships. Inventory free-to-use remains a calculated value: `on_hand - reserved`.
