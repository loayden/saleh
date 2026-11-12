# صَالِح

Premium Arabic-first fabric discovery storefront.

## Run locally

```bash
npm run dev
```

Open `http://localhost:3000`. The homepage and catalog read verified, active products from Supabase. If the database has no verified products yet, the customer sees an honest empty state instead of placeholder products.

## Main routes

- `/` customer storefront
- `/shop`, `/fabrics`, `/categories` live catalog pages
- `/fabrics/[slug]` fabric ID page with color, meters, pricing, cart, checkout, and tailoring intent
- `/cart`, `/checkout` persistent cart and order flow
- `/assistant`, `/visualizer` AI-ready assistant and inspiration workflow
- `/guide` Arabic fabric education
- `/tailors` tailor discovery and quotation request
- `/auth`, `/auth/signup`, `/auth/forgot-password`, `/auth/reset-password`, `/favorites`, `/orders`, `/addresses`, `/account` customer account pages
- `/merchant` merchant operations shell
- `/admin` platform operations shell, `/admin/products` protected catalog management
- `/privacy` and `/terms` customer disclosures
- `/api/health` uptime/readiness endpoint; monitoring, backup, and staging procedures are in [`OPERATIONS_RUNBOOK.md`](./OPERATIONS_RUNBOOK.md)

## Verification

```bash
npm run lint
npm run build
```

For the full verified status, see [COMPLETE_FEATURE_MATRIX.md](./COMPLETE_FEATURE_MATRIX.md).

Before deployment, follow [PRODUCTION_PREFLIGHT.md](./PRODUCTION_PREFLIGHT.md) and use [.env.example](./.env.example) as the configuration template.

Photography provenance and replacement guidance is documented in [IMAGE_SOURCES.md](./IMAGE_SOURCES.md).

The Supabase project is linked locally and migrations `0001` through `0013` are applied. The homepage, catalog, product detail, persistent cart, checkout reservation, account profile/password recovery, tailoring requests, merchant operations, admin catalog management, product/profile image Storage, health monitoring, Web Vitals, and analytics use live Supabase-backed data. The linked project currently contains zero verified products and zero inventory rows, so the storefront intentionally shows an empty state until real merchant catalog data is imported. Provider credentials, managed backup/PITR settings, role-provisioned staging accounts, and production monitoring routing still need to be configured before commercial launch.
