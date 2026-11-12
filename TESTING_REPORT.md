# Testing report

Date: 2026-11-12

## Passing checks

- `npx tsc --noEmit` passed.
- `npm run build` passed and includes all customer, operations, AI, cart, and Paymob routes.
- `npm run lint` passed with 0 errors; remaining findings are 18 Next.js image-optimization warnings.
- `npm run test:smoke` passed all route, auth-boundary, live-catalog, cart, AI-boundary, payment-boundary, and analytics checks.
- `supabase migration list` shows local and remote migrations aligned through `0013`.
- Browser smoke checks at 390px covered public catalog/category pages, auth and password recovery, favorites/cart/checkout, tailoring/AI pages, legal pages, protected admin products, and the home mobile menu. All checked pages fit the viewport with no horizontal overflow, hydration text, or browser Console errors.
- `npm run test:e2e:staging` is configured with Playwright for public routes, `/api/health`, anonymous security boundaries, mobile navigation, and optional real staging product/customer flows; the remote staging job requires `STAGING_BASE_URL` and disposable staging records.
- `npm run backup:database` creates and verifies a custom PostgreSQL dump plus SHA-256 checksum; `npm run backup:restore-drill` refuses to run without an isolated target and explicit confirmation.

## Intentionally blocked until configured

- Successful authenticated checkout needs a real test user and at least one verified product with stock; the linked project currently has zero verified products and zero inventory rows.
- Paymob live/sandbox completion needs secret/public/integration/HMAC values and a publicly reachable webhook.
- OpenAI analysis/generation needs `OPENAI_API_KEY` and production upload/moderation policy.
- Carrier tracking needs a chosen delivery provider and signed webhook contract.
- Role-specific merchant/admin/tailor E2E needs provisioned staging accounts and records.
