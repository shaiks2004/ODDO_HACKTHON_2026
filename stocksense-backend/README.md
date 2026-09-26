# StockSense Backend

FastAPI backend for StockSense, using SQLAlchemy 2.x and the existing PostgreSQL 18 database `Odoo_Hackthon`. The schema is treated as frozen; the application does not create or migrate tables.

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
OTP_EXPIRE_MINUTES=10
STOCKSENSE_SYSTEM_USER_ID=00000000-0000-0000-0000-000000000001
```

Use the existing database credentials in `DATABASE_URL`; do not put a database password in source control. `STOCKSENSE_SYSTEM_USER_ID` must identify an existing user for ledger movements. Password reset codes are persisted but no email/SMS delivery provider is configured yet.

## Running and testing

```powershell
uvicorn app.main:app --reload
python -m pytest
```

Swagger is available at `http://127.0.0.1:8000/docs`. `GET /health` reports service status; `GET /health/db` performs a read-only `SELECT 1` connection check. `tests/test_database.py` checks that the seeded product data is visible without modifying the database.

## API Foundation

Phase 1 master-data and read-only inventory endpoints remain available under `/api/v1`. Phase 2 adds signup/login and password reset, authenticated receipt/delivery/transfer/adjustment workflows, paginated stock-ledger history, and a dashboard summary. Stock-changing validation runs through the transactional movement engine. These are the initial API flows; an OTP delivery channel is still required for a user-facing password-reset flow.

Run all tests with `python -m pytest`. PostgreSQL integration tests require a configured `.env`; test fixtures wrap each test in an outer transaction and roll it back after the test.

## Database architecture

The mapped tables are `users`, `otp_codes`, `categories`, `products`, `warehouses`, `locations`, `inventory`, `receipts`, `receipt_items`, `deliveries`, `delivery_items`, `transfers`, `transfer_items`, `adjustments`, and `stock_ledger`.

Categories own products; warehouses own locations; inventory joins a product to a location. Receipt, delivery, transfer, adjustment, and ledger records are mapped with their actual foreign-key relationships. Inventory free-to-use remains a calculated value: `on_hand - reserved`.
