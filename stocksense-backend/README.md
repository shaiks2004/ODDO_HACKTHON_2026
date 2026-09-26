# StockSense Backend

**Architecture/Scaffolding Phase**

StockSense is a modular-monolith inventory management system for inventory managers and warehouse staff. This repository currently contains the backend structure and contracts only. Business workflows, CRUD endpoints, authentication behavior, stock calculations, migrations, and persistence are intentionally not implemented yet.

## Architecture

- `app/api`: versioned FastAPI routers; route handlers will stay thin.
- `app/services`: transactional business rules and workflow orchestration.
- `app/repositories`: database access, filtering, and pagination.
- `app/models`: SQLAlchemy model placeholders.
- `app/schemas`: Pydantic request/response placeholders.
- `app/core`: settings, database session infrastructure, security extension points, and exceptions.
- `app/utils`: shared enums and reusable utility extension points.
- `alembic`: migration configuration and future revisions.
- `tests`: test module placeholders for each business area.

## Tech Stack

Python 3.11+, FastAPI, PostgreSQL, SQLAlchemy 2.x, Alembic, Pydantic v2, JWT infrastructure, secure password hashing, pytest, and pytest-asyncio.

## Setup

From `stocksense-backend/`:

```powershell
python -m venv venv
venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
```

Set real local values in `.env`; never commit that file. Start PostgreSQL with:

```powershell
docker compose up -d postgres
```

The database URL in `.env.example` matches the compose service. No tables or migration revisions exist yet. Once models are implemented, use:

```powershell
alembic revision --autogenerate -m "initial schema"
alembic upgrade head
```

## Running the API

```powershell
uvicorn app.main:app --reload
```

Swagger UI will be available at `http://127.0.0.1:8000/docs` and ReDoc at `http://127.0.0.1:8000/redoc`.

## Testing

```powershell
pytest
```

The current test modules are placeholders and do not claim implemented functionality.

## Planned Tables and Relationships

Planned tables are `users`, `categories`, `products`, `warehouses`, `locations`, `inventory`, `receipts`, `receipt_items`, `deliveries`, `delivery_items`, `transfers`, `transfer_items`, `adjustments`, and `stock_ledger`.

Categories have many products. Warehouses have many locations. Inventory joins products to locations and will hold on-hand and reserved quantities. Receipts, deliveries, transfers, and adjustments own their item or quantity records and reference the creating user. The stock ledger records product movements with optional source and destination locations and a document reference.

## Next Implementation Phase

1. Implement SQLAlchemy models, constraints, indexes, and relationships.
2. Implement Pydantic schemas and repository query contracts.
3. Add password hashing, JWT issuance, OTP lifecycle, and auth dependencies.
4. Implement transactional receipt, delivery, transfer, and adjustment services with ledger writes.
5. Add routers, dashboard queries, filtering/pagination, Alembic revisions, and focused tests.
