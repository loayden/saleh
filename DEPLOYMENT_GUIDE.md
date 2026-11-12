# Deployment guide

1. Set the production environment variables in the hosting provider.
2. Provision PostgreSQL/Supabase and apply migrations.
3. Configure storage for product and inspiration images.
4. Configure authentication redirect URLs.
5. Configure Paymob webhook URLs and verify signatures.
6. Configure the delivery provider or enable manual delivery mode.
7. Run `npm run lint && npm run build`.
8. Run end-to-end checkout, inventory, webhook, and delivery tests in staging.
9. Configure `/api/health`, the structured error collector, managed Supabase backups/PITR, and a tested restore drill.
10. Run the staging Playwright suite with `STAGING_BASE_URL` and provisioned disposable test records.
11. Review logs, rate limits, backups, and rollback procedure before launch.

The application persistence and server integration seams are implemented. Production launch still requires verified catalog/tailor data, provider secrets, public webhook URLs, role-provisioned staging accounts, managed backup/PITR activation, monitoring destination configuration, and successful staging E2E tests. See [`OPERATIONS_RUNBOOK.md`](./OPERATIONS_RUNBOOK.md).
