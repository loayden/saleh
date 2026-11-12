# Application verification checklist

Last verified: 2026-11-12

Status meanings:

- `TESTED — PASSED`: exercised successfully in this workspace.
- `IMPLEMENTED — NOT TESTED`: code exists but needs an authenticated role or real record.
- `BLOCKED — DEPENDENCY REQUIRED`: provider credentials, verified data, or deployment infrastructure is required.

## Customer pages

| Route | Status | Evidence / limitation |
|---|---|---|
| `/`, `/shop`, `/fabrics`, `/categories` | TESTED — PASSED | Live Supabase catalog boundary, search/category UI, honest zero-record state, mobile no-overflow checks. |
| `/fabrics/[slug]` | TESTED — PASSED | Fabric ID page has color/meters/dynamic total, stock guard, cart, checkout, and tailoring intent; live success needs a verified product. |
| `/cart`, `/checkout` | TESTED — PASSED | Persistent/local cart boundaries, item summary, Cairo/Alexandria fee, authenticated reservation boundary, and empty states. |
| `/tailoring/[slug]`, `/tailors` | TESTED — PASSED | Real brief/request boundary and verified-tailor query; current project has zero verified tailors. |
| `/visualizer`, `/assistant` | TESTED — PASSED | Live inventory input and visible 501 dependency states without OpenAI key. |
| `/favorites`, `/account`, `/orders`, `/addresses` | TESTED — PASSED | Auth redirects and account pages; authenticated CRUD needs a provisioned test account. |
| `/auth`, `/auth/signup`, `/auth/forgot-password`, `/auth/reset-password` | TESTED — PASSED | Supabase email/password UI, safe `next` handling, password recovery, and reset flow. |
| `/guide`, `/privacy`, `/terms`, `/design/[slug]` | TESTED — PASSED | Content pages and legacy tailoring redirect build and smoke successfully. |

## API and database

| Boundary | Status | Evidence / limitation |
|---|---|---|
| Catalog, tailors, wishlist, addresses, cart | TESTED — PASSED | Supabase-backed routes and anonymous boundaries pass smoke checks. |
| `POST /api/orders/validate` | TESTED — PASSED | Live verified-product/stock validation without reservation. |
| `POST /api/orders` | IMPLEMENTED — NOT TESTED | Calls the deployed transaction-safe reservation RPC; needs authenticated user + verified stock. |
| `POST /api/tailoring-requests` | IMPLEMENTED — NOT TESTED | Persists customer brief/reference data; needs an authenticated submission. |
| `POST /api/events` | TESTED — PASSED | Validated events persist to Supabase. |
| `GET /api/health` and Web Vitals | TESTED — PASSED | Local health check reaches the linked Supabase database; Web Vitals are accepted as `web_vital` analytics events. External collector routing still needs a configured endpoint. |
| OpenAI routes | BLOCKED — DEPENDENCY REQUIRED | Server calls and schema/verified-inventory constraints are implemented; no `OPENAI_API_KEY` is configured. |
| Paymob intention | BLOCKED — DEPENDENCY REQUIRED | Server implementation is present; no Paymob secret/integration/public URL is configured. |
| Paymob webhook | BLOCKED — DEPENDENCY REQUIRED | HMAC, amount, correlation, idempotent status update are implemented; requires HMAC + service-role secrets and public callback. |
| Migrations/RLS/RBAC | TESTED — PASSED | Local and remote migrations align through `0013`; profile avatars and product image Storage policies are applied. Authenticated role E2E still needs role accounts. |

## Operations and deployment gates

| Area | Status | Required action |
|---|---|---|
| Merchant catalog | IMPLEMENTED — NOT TESTED | `/admin/products` supports real product create/edit, image URL/Storage upload, inventory, publish/unpublish, verification, and safe deactivation. The linked project currently has zero verified products/inventory, so real catalog onboarding remains required. |
| Database backups | IMPLEMENTED — NOT TESTED | Custom `pg_dump` plus checksum/`pg_restore --list` and explicitly guarded restore-drill scripts are present; a real production dump/restore requires an isolated target and operator-managed secrets. |
| Staging E2E | TESTED — PASSED locally | Playwright covers public routes, health, anonymous boundaries, mobile navigation, and no-fake-data checks. Remote staging URL, disposable customer credentials, and optional verified product are still required for full authenticated E2E. |
| Tailor marketplace | BLOCKED — DEPENDENCY REQUIRED | Add verified active tailor records and portfolios. |
| Delivery provider | BLOCKED — DEPENDENCY REQUIRED | Select carrier, configure secrets, implement/test signed quote/shipment/tracking webhooks. Manual merchant status is live. |
| Monitoring/backups/analytics | BLOCKED — DEPENDENCY REQUIRED | Configure production services, retention, alerting, backup policy, and incident response. |
| Full staging E2E | BLOCKED — DEPENDENCY REQUIRED | Seed real staging records and accounts, then test reservation, payment, delivery, cancellation, return, and role flows. |

## Verification commands

```bash
npx tsc --noEmit
npm run build
npm run lint
npm run test:smoke
supabase migration list
```

Current lint result: 0 errors and 18 non-blocking Next.js image-optimization warnings.
