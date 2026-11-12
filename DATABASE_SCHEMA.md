# Database schema plan

Prices are stored as integer piasters or a fixed-precision EGP decimal. Quantities use fixed precision to support partial meters.

Core tables: `users`, `customer_profiles`, `addresses`, `merchant_profiles`, `fabric_products`, `fabric_categories`, `fabric_images`, `fabric_attributes`, `inventory`, `inventory_movements`, `wishlists`, `carts`, `cart_items`, `orders`, `order_items`, `payments`, `deliveries`, `delivery_events`, `tailors`, `tailoring_requests`, `inspirations`, `ai_sessions`, `ai_recommendations`, `saved_designs`, `coupons`, `reviews`, `notifications`, `audit_logs`.

Important constraints:

- SKU and product slugs are unique.
- Inventory quantity cannot become negative.
- Order item price is copied at checkout; it is not recalculated from the live catalog.
- Payment status changes only from verified gateway callbacks or an authorized manual action.
- Delivery status changes are append-only events plus a current status projection.
- AI output is stored separately from verified merchant attributes.

Recommended indexes: product slug, category, availability, price, city/district, order status, customer ID, created-at timestamps, and full-text/search embeddings where enabled.
