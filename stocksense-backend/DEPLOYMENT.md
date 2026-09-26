# StockSense Deployment

## Prerequisites

- Docker Engine and Docker Compose v2.
- Python 3.11+ for running tests locally.
- PostgreSQL 18 client (`psql`) if initializing the bundled database manually.

## Environment

For local Compose use, copy `.env.example` to `.env` and replace `JWT_SECRET_KEY` with a unique random value. The template's PostgreSQL password is development-only. Never use it in production or commit `.env`.

For production, copy `.env.production.example` to a protected deployment environment file and set every placeholder, including a long random JWT secret, database credentials, the system-user UUID, and the exact frontend origin(s). `CORS_ALLOWED_ORIGINS` accepts comma-separated origins without trailing paths. In production, an empty origin list denies browser cross-origin access; wildcard origins are rejected.

The process-local authentication limiter uses `AUTH_RATE_LIMIT` such as `5/minute`. It is suitable for one backend instance only; it is not a distributed limiter.

## Database Initialization

Compose creates a persistent, empty local PostgreSQL database and does not execute project SQL automatically. For a clean database only, run the files in order once:

```powershell
Get-Content database/001_schema.sql | docker compose exec -T postgres psql -U stocksense -d Oddo_Hackthon
Get-Content database/002_seed.sql | docker compose exec -T postgres psql -U stocksense -d Oddo_Hackthon
Get-Content database/003_validate.sql | docker compose exec -T postgres psql -U stocksense -d Oddo_Hackthon
```

Do not run schema or seed scripts against a populated database. They are not application startup hooks. Back up and confirm the database target before any manual database initialization. The Compose volume is persistent; `docker compose down` does not delete it. Do not use `docker compose down -v` unless intentionally deleting the local development database.

## Build and Start

```powershell
Copy-Item .env.example .env
# Edit .env and set JWT_SECRET_KEY before starting.
docker compose build
docker compose up -d
```

The backend waits for PostgreSQL's `pg_isready` healthcheck. `DATABASE_URL` is for a host-run API; `DATABASE_URL_DOCKER` is passed into the container and should use the Compose service hostname `postgres`. The host port defaults to `5433` to avoid conflicting with a local PostgreSQL installation on `5432`.

## Health and API Documentation

```powershell
docker compose ps
Invoke-RestMethod http://localhost:8000/health
Invoke-RestMethod http://localhost:8000/health/db
```

Open Swagger at `http://localhost:8000/docs`. The current generated OpenAPI snapshot is `docs/openapi.json`; refresh it from the running application after API contract changes.

## Tests and Logs

```powershell
python -m pytest -q
docker compose logs -f backend
docker compose logs -f postgres
```

Tests use the configured database connection and transaction rollback fixture. Point tests only at a disposable/test database or the project's seeded development database; do not run mutation tests against production.

## CSV Reporting Integration

CSV exports stream from the `report_export_provider` adapter contract. Phase 3 reporting services are not present in this checkout; export routes return `503` until a Phase 3 provider implementing `columns()` and lazy `iter_rows()` is attached to `app.state.report_export_provider`. This avoids duplicating report queries and preserves Phase 3 as the source of report data.

## Security Notes

- Keep `.env` and production secret files outside source control.
- Use HTTPS at the production ingress and set explicit `CORS_ALLOWED_ORIGINS`.
- Access and refresh JWTs have distinct token-type claims. Refresh tokens are rejected by protected API dependencies.
- Refresh tokens are stateless and cannot currently be revoked individually before expiry.
- Login, forgot-password, and reset-password use process-local sliding-window rate limits. Use a shared gateway limiter before scaling to multiple backend processes.
- The optional alert webhook is best-effort, has a short request timeout, and cannot roll back a committed inventory transaction.
- Password-reset OTPs are persisted, but no email/SMS delivery provider is configured.
- Never expose database credentials or JWT secrets in API responses, logs, the frontend, or Postman collection variables.
