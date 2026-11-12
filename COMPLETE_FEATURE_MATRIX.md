# Feature completion matrix

## Customer experience

- [x] Arabic RTL storefront, mobile-first navigation, bottom navigation, and responsive design
- [x] Live Supabase catalog boundary with honest empty state
- [x] Search, category filters, Supabase wishlist, authenticated cart, anonymous cart migration, and cart page
- [x] Fabric ID page with color, meters, stock guard, dynamic price, and buy-fabric/tailoring choice
- [x] Checkout with customer name, phone, Cairo/Alexandria address, delivery fee, and persisted order
- [x] Inspiration upload, visualizer, Arabic assistant, and explicit provider boundaries
- [x] Tailor discovery and quotation-request UI with saved brief/reference data
- [x] Dedicated auth/signup, password recovery/reset, favorites, orders, addresses, editable account profile/avatar, guide, privacy, and terms pages

## Operations and security

- [x] Merchant inventory dashboard, product onboarding, order status, tailoring request status, and role gate
- [x] Admin dashboard with live counts/city aggregation plus protected product create/edit/image/publish/verify/deactivate controls
- [x] Supabase Storage buckets and RLS for profile avatars and product images
- [x] PostgreSQL transaction-safe inventory reservation and inventory movements
- [x] Customer/merchant/admin/tailor RLS policies, verified-product public reads, and locked customer payment status updates
- [x] Catalog, cart, wishlist, address, order, tailoring, analytics, assistant, and inspiration APIs
- [x] Sitemap, robots, manifest, canonical/Open Graph metadata, security headers, and input guards
- [x] `/api/health`, Next request-error instrumentation, structured logs, and Web Vitals monitoring seam
- [x] Verified PostgreSQL dump/restore-drill scripts with checksums and safe explicit restore confirmation
- [x] Reproducible Playwright staging E2E suite and scheduled/manual GitHub Actions workflow
- [x] TypeScript, build, lint, smoke, migration-alignment, and mobile browser verification across public/auth/cart/checkout/protected routes

## Provider boundaries

- [x] Paymob intention route, amount correlation, provider reference persistence, and HMAC-verified processed webhook implementation
- [x] OpenAI vision, structured assistant, and image-generation server routes constrained to live inventory
- [x] Cash-on-delivery and manual delivery status path
- [ ] Paymob keys, public webhook deployment, and sandbox payment E2E
- [ ] Delivery carrier credentials, quotes, labels, tracking adapter, and signed carrier webhooks
- [ ] OpenAI key, storage/retention, moderation, rate limits, cost limits, and evaluation set
- [ ] Verified merchant catalog, tailor profiles, approved media, and role-provisioned staging accounts
- [ ] Production analytics provider, monitoring, backups, alert routing, and incident response

Unchecked items are deployment/provider gates. The app intentionally does not invent provider responses or catalog records while those dependencies are absent.
