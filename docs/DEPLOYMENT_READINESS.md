# Deployment readiness checklist

DataPulse is a demo analytics service. The current application calls SQLAlchemy `Base.metadata.create_all` at startup; this is convenient for local development but is not a versioned schema migration strategy for production.

## Required before production deployment

- Apply the versioned Alembic migration (`alembic upgrade head`) as a controlled release step, not independently in every API worker.
- Keep automatic `Base.metadata.create_all` limited to development/test environments; production startup must not silently mutate schema.
- CI applies the initial migration to PostgreSQL 16 and runs `alembic check`; endpoint tests still use SQLite, so this does not replace full PostgreSQL API integration coverage.
- Keep `/health` as a liveness check and `/health/ready` as a dependency-aware readiness check.
- Configure explicit CORS origins per environment; do not use wildcard origins with credentials.
- Configure `DATAPULSE_API_KEY` as a secret and set `ENVIRONMENT=production` before exposing ingestion or analytics routes. The current shared API key is a service-level gate, not per-user identity or role-based authorization.
- Define retention, deletion, and access-control policies before storing real user/event data.
- Add request-size limits, rate limits, structured logs, and metrics for ingestion failures.
- Use secret-managed database credentials and verify backups/restore procedures.

## Release verification

1. Start with a clean database and apply migrations from zero.
2. Upgrade a database created by the previous release.
3. Run API integration tests for event ingestion, validation errors, analytics aggregations, and database outage.
4. Confirm readiness returns HTTP 503 when the database is unavailable.
5. Confirm the service does not silently create or mutate production schema on application startup.

Do not describe the current demo as production-ready until these gates are implemented and tested.
