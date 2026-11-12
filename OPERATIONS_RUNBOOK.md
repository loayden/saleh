# Monitoring, backups, and staging runbook

This runbook is intentionally provider-neutral. The repository now exposes the application hooks and repeatable commands; the hosted Supabase plan, monitoring account, deployment platform, and CI secrets still belong to the operator.

## Monitoring

### Health check

`GET /api/health` is safe for an uptime monitor. It returns:

- `200` and `status: "ok"` when the application can reach Supabase.
- `503` and `status: "degraded"` when the database check fails.
- non-secret booleans for OpenAI, Paymob, delivery, and observability configuration.

Point the monitor at the deployed HTTPS URL, alert on `503`, and use a 60-second interval with a 3-failure threshold. Do not expose service-role or provider credentials in monitor URLs.

### Error reporting

Next instrumentation captures server request errors in structured JSON logs. Set these server-only variables to forward the redacted event payload to an approved collector:

```env
OBSERVABILITY_INGEST_URL=https://your-collector.example/errors
OBSERVABILITY_INGEST_TOKEN=...
```

The payload excludes cookies, authorization headers, request bodies, and query strings. Keep the collector behind HTTPS and rotate its token through the deployment secret manager.

Web Vitals are sent as the `web_vital` analytics event. Admin analytics/RLS remain the source of truth for stored events; configure retention and alerting in the chosen analytics provider.

## Database backups

### Managed Supabase protection

In the Supabase production project:

1. Enable the plan's automated database backups and point-in-time recovery if available.
2. Set a retention period that meets the business/legal requirement.
3. Restrict backup and restore permissions to the production operators.
4. Document the project ref, recovery owner, RPO, RTO, and escalation path in the private operations system.
5. Test a restore into a separate Supabase project at least monthly.

The CLI migration files are not a substitute for managed backups. PostgreSQL dumps also do not contain Supabase Storage object bytes.

### Portable dump

From a trusted CI runner or operator machine with `pg_dump` installed:

```bash
DATABASE_URL='postgresql://...' npm run backup:database
```

The script writes a custom-format dump under `backups/`, verifies it with `pg_restore --list`, and writes a SHA-256 sidecar. `BACKUP_DIR` can point to an encrypted artifact directory. Retention pruning is opt-in:

```bash
BACKUP_PRUNE=true BACKUP_RETENTION_DAYS=14 DATABASE_URL='postgresql://...' npm run backup:database
```

Never commit the generated directory. Back up `product-images`, `profile-avatars`, and any future private inspiration bucket separately using the storage provider's object replication/export policy.

### Restore drill

Restore only into an isolated target database. The command refuses to run without an explicit acknowledgement and refuses the source URL:

```bash
RESTORE_DATABASE_URL='postgresql://isolated-target' \
RESTORE_DRILL_CONFIRM=I_UNDERSTAND \
npm run backup:restore-drill -- backups/saleh-YYYYMMDDTHHMMSSZ.dump
```

Record the restore duration, row checks, migration version, and whether the deployed app can pass `/api/health` against the restored target.

## Staging E2E

The reusable Playwright suite lives in `tests/e2e/staging.spec.ts`. It covers public routes, health/readiness, anonymous security boundaries, mobile navigation/no-overflow, and the no-fake-data boundary. It can also run a real product flow and customer login when the relevant staging variables are supplied.

Local run against a running app:

```bash
STAGING_BASE_URL=http://localhost:3000 npm run test:e2e:staging
```

Required CI secret:

- `STAGING_BASE_URL`

Optional CI secrets/variables:

- `STAGING_TEST_EMAIL` and `STAGING_TEST_PASSWORD` for authenticated customer E2E.
- `STAGING_PRODUCT_SLUG` for the real product ID flow; this must be a verified, active, in-stock staging product.

The GitHub Actions workflow is manual/scheduled and stores the Playwright report as an artifact. It does not create users, products, orders, or payment transactions, so the staging project must provide disposable records and a cleanup policy.

## Launch gate

Do not mark production ready until `/api/health` is green, a backup restore drill passes, the scheduled E2E job is green, and Paymob/delivery/OpenAI monitoring has an owner and alert route.
