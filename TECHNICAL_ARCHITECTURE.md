# Technical architecture

## Current

Next.js App Router, React, TypeScript, Supabase SSR, PostgreSQL functions, Lucide icons, RTL CSS tokens, and mobile-first route components. Public catalog reads only active, verified products and inventory. Authenticated mutations use server route handlers and RLS.

## Domain boundaries

- Catalog: `GET /api/fabrics` and verified Supabase rows.
- Commerce: persistent carts, checkout validation, `create_order_with_reservation`, order items, payments, deliveries, and inventory movements.
- Identity: Supabase Auth plus profile roles (`customer`, `merchant`, `admin`, `tailor`) and route/policy checks.
- AI: server-only OpenAI Responses/image calls; outputs are constrained to live candidate IDs and return a setup boundary without a key.
- Payments: Paymob Intention creation on the server; HMAC-verified processed callback updates payment/order state. Cash on delivery remains available.
- Delivery: Cairo/Alexandria fee rules and merchant-managed status are live; an external carrier adapter is intentionally configuration-dependent.

## Safety rules

Secrets remain server-only. Stock is decremented inside a PostgreSQL transaction with row locking. Public pages never fabricate product, price, stock, tailor, recommendation, payment, or tracking data. Generated images are labeled approximate concepts.
