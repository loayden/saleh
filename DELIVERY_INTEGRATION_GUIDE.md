# Delivery integration guide

The application supports Cairo and Alexandria. Checkout calculates and persists the same delivery fee used by the database reservation function: 50 ج.م for Cairo and 60 ج.م for Alexandria. Merchant/admin users can update the order and delivery status through the protected operations routes.

The status model is:

`new → confirmed → preparing → handed_to_carrier → in_transit → delivered`, with `cancelled` and `returned` branches.

An external carrier adapter is intentionally not fabricated. Before launch, configure `DELIVERY_PROVIDER_BASE_URL` and `DELIVERY_PROVIDER_TOKEN`, implement quote/create/cancel/track calls for the selected carrier, verify signed webhooks, make updates idempotent, and test Cairo/Alexandria staging shipments. Manual merchant delivery remains the current fallback.
