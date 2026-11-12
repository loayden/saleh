# Project audit

Audit date: 2026-11-12

The application is a Next.js App Router + TypeScript Arabic-first fabric marketplace. It is no longer a client-only demo: catalog, wishlist, addresses, carts, orders, inventory reservation, tailoring requests, analytics, merchant actions, and RBAC use Supabase boundaries.

## Implemented

- Premium RTL storefront with dedicated catalog, product ID, cart, checkout, tailoring, account, auth, merchant, admin, guide, privacy, and terms pages.
- Product detail flow: verified product data, color, meters, dynamic price, buy fabric or request a garment, upload/brief submission, and admin-visible request persistence.
- Authenticated Supabase email/password foundation, protected pages, role checks, customer/merchant/admin/tailor policies, and safe auth redirects.
- Persistent authenticated cart plus anonymous local cart migration, stock checks, and transaction-safe order reservation.
- Paymob intention and HMAC webhook server routes with explicit setup responses when secrets are absent.
- OpenAI server routes for vision analysis, structured assistant responses, and image generation with verified-inventory constraints and explicit dependency boundaries.
- Mobile-first navigation and tested no-overflow states at the requested phone widths for the core routes.

## Operational dependencies

- The linked Supabase project currently has no verified active fabric products or verified tailors, so public catalog pages correctly show empty states rather than invented products.
- Paymob, delivery provider, OpenAI, monitoring, backups, storage retention, and staging test accounts require the operator's provider configuration. The code refuses to fake those services and returns visible setup boundaries.
- Production launch still requires real merchant/tailor onboarding, provider sandbox tests, authenticated E2E tests, and deployment-specific observability.
