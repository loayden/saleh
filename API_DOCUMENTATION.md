# API contract

All public catalog reads are live Supabase queries. Authenticated mutations are validated server-side and protected by Supabase Auth/RLS.

## Catalog and customer data

- `GET /api/fabrics?query=&type=&available=true` — verified active products and current inventory.
- `GET /api/tailors` — active verified tailor profiles.
- `GET/POST/DELETE /api/wishlist` — authenticated wishlist; anonymous GET is an empty boundary.
- `GET/POST/DELETE /api/addresses` — authenticated address book.
- `GET/POST/PATCH/DELETE /api/cart` — authenticated persistent cart; anonymous users use the local cart UI.
- `POST /api/events` — allowlisted analytics events persisted to Supabase.

## Commerce

- `POST /api/orders/validate` — live product/stock validation without reservation.
- `POST /api/orders` — invokes the transaction-safe reservation RPC and persists order, items, payment, delivery, and inventory movement records.
- `POST /api/tailoring-requests` — persists garment brief, optional fabric/tailor references, measurements, and uploaded reference metadata.

## AI

- `POST /api/inspiration/analyze` — OpenAI vision + structured output, constrained to verified inventory; returns `501` without `OPENAI_API_KEY`.
- `POST /api/inspiration/generate` — OpenAI image generation; returns `501` without `OPENAI_API_KEY`.
- `POST /api/assistant` — server-side Arabic assistant constrained to live inventory/customer data; returns `501` without a key.

## Payments and operations

- `POST /api/payments/paymob/intention` — creates a Paymob Intention for an authenticated, unpaid order and returns a client secret; requires Paymob secrets.
- `POST /api/payments/paymob/webhook` — verifies Paymob transaction HMAC, checks amount/order correlation, and updates payment/order state; requires HMAC and Supabase service-role secrets.
- `PATCH /api/merchant/orders`, `PATCH /api/merchant/tailoring-requests`, `POST/PATCH/DELETE /api/merchant/products` — merchant/admin role-gated operations.

External delivery quote, label, and carrier webhooks are not claimed as live until a carrier contract and credentials are configured. All unknown provider states remain visible setup boundaries.
