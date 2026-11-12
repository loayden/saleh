# Production preflight

## Required before launch

- [ ] Copy `.env.example` into the deployment secret manager; do not commit `.env`.
- [ ] Configure `NEXT_PUBLIC_SITE_URL` with the canonical HTTPS domain.
- [ ] Provision PostgreSQL/Supabase and apply migrations.
- [ ] Enable authentication and configure secure redirect URLs.
- [ ] Import verified merchant products, attributes, images, prices, and stock through `/admin/products`; the linked project currently has no verified catalog rows.
- [ ] Configure storage restrictions and retention for inspiration images.
- [ ] Configure Paymob and verify signed webhook callbacks in staging.
- [ ] Configure delivery provider or explicitly enable manual delivery mode.
- [ ] Configure analytics and error monitoring with privacy-safe settings; verify `/api/health` alerts and `OBSERVABILITY_INGEST_URL` delivery.
- [ ] Enable Supabase automated backups/PITR, schedule `npm run backup:database`, and complete an isolated restore drill.
- [ ] Set `STAGING_BASE_URL` and run `npm run test:e2e:staging` against staging.
- [ ] Run `npm run lint`, `npm run build`, and `npm run test:smoke` against staging.
- [ ] Test stock reservation, duplicate submission, payment failure, cancellation, return, and delivery exception flows.
- [ ] Review Arabic copy, accessibility, backups, rate limits, and rollback procedure.

The repository currently passes code/build/smoke checks. The unchecked items are deployment and provider gates, not fabricated application functionality; complete them before calling the deployment production-ready.
