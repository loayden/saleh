const base = process.env.SMOKE_BASE_URL || "http://localhost:3000";
const checks = [
  ["storefront", "/", 200],
  ["shop route", "/shop", 200],
  ["fabrics route", "/fabrics", 200],
  ["categories route", "/categories", 200],
  ["evening category route", "/categories/evening", 200],
  ["merchant route", "/merchant", 200],
  ["admin route", "/admin", 200],
  ["tailor route", "/tailors", 200],
  ["visualizer route", "/visualizer", 200],
  ["auth route", "/auth", 200],
  ["signup route", "/auth/signup", 200],
  ["forgot password route", "/auth/forgot-password", 200],
  ["reset password route", "/auth/reset-password", 200],
  ["favorites route", "/favorites", 200],
  ["cart route", "/cart", 200],
  ["assistant route", "/assistant", 200],
  ["orders auth redirect", "/orders", 200],
  ["addresses auth redirect", "/addresses", 200],
  ["product route", "/fabrics/satin-pearl", 200],
  ["checkout route", "/checkout?fabric=satin-pearl&meters=3&color=%D9%88%D8%B1%D8%AF%D9%8A", 200],
  ["tailoring route", "/tailoring/satin-pearl?meters=3&color=%D9%88%D8%B1%D8%AF%D9%8A", 200],
  ["guide route", "/guide", 200],
  ["robots", "/robots.txt", 200],
  ["sitemap", "/sitemap.xml", 200],
  ["health endpoint", "/api/health", 200],
  ["catalog API", "/api/fabrics", 200],
  ["tailors API", "/api/tailors", 200],
  ["wishlist anonymous API", "/api/wishlist", 200],
  ["admin products protected page", "/admin/products", 200],
];
let failed = 0;
for (const [name, path, expected] of checks) {
  const response = await fetch(`${base}${path}`);
  if (response.status !== expected) { console.error(`FAIL ${name}: expected ${expected}, got ${response.status}`); failed += 1; }
  else console.log(`PASS ${name}`);
}
const validation = await fetch(`${base}/api/orders/validate`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ city: "القاهرة", lines: [{ fabricId: "not-in-catalog", meters: 2 }] }) });
if (validation.status !== 409 || (await validation.json()).valid) { console.error("FAIL live order validation"); failed += 1; } else console.log("PASS live order validation");
const invalid = await fetch(`${base}/api/orders/validate`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ city: "طنطا", lines: [{ fabricId: "satin-pearl", meters: 2 }] }) });
if (invalid.status !== 400) { console.error(`FAIL invalid order validation: expected 400, got ${invalid.status}`); failed += 1; } else console.log("PASS invalid order validation");
const malformedLines = await fetch(`${base}/api/orders/validate`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ city: "القاهرة", lines: [null] }) });
if (malformedLines.status !== 400) { console.error(`FAIL malformed order validation: expected 400, got ${malformedLines.status}`); failed += 1; } else console.log("PASS malformed order validation");
const invalidImage = await fetch(`${base}/api/inspiration/analyze`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ imageData: "not-an-image" }) });
if (invalidImage.status !== 400) { console.error(`FAIL invalid inspiration: expected 400, got ${invalidImage.status}`); failed += 1; } else console.log("PASS invalid inspiration");
const cart = await fetch(`${base}/api/cart`);
if (cart.status !== 200 || (await cart.json()).authenticated !== false) { console.error(`FAIL anonymous cart boundary: expected 200 anonymous, got ${cart.status}`); failed += 1; } else console.log("PASS anonymous cart boundary");
const blockedAssistant = await fetch(`${base}/api/assistant`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ message: "ما أفضل قماش؟" }) });
if (![501, 409].includes(blockedAssistant.status)) { console.error(`FAIL assistant dependency boundary: expected 501 or 409 without inventory, got ${blockedAssistant.status}`); failed += 1; } else console.log("PASS assistant dependency boundary");
const blockedGeneration = await fetch(`${base}/api/inspiration/generate`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ imageData: "data:image/png;base64,AAAA" }) });
if (blockedGeneration.status !== 501) { console.error(`FAIL image generation boundary: expected 501, got ${blockedGeneration.status}`); failed += 1; } else console.log("PASS image generation boundary");
const paymentBoundary = await fetch(`${base}/api/payments/paymob/webhook`, { method: "POST" });
if (paymentBoundary.status !== 501) { console.error(`FAIL payment boundary: expected 501, got ${paymentBoundary.status}`); failed += 1; } else console.log("PASS payment boundary");
const intentionBoundary = await fetch(`${base}/api/payments/paymob/intention`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ orderId: "00000000-0000-0000-0000-000000000000" }) });
if (![501, 401].includes(intentionBoundary.status)) { console.error(`FAIL intention boundary: expected 501 or 401, got ${intentionBoundary.status}`); failed += 1; } else console.log("PASS intention boundary");
const unauthenticatedOrder = await fetch(`${base}/api/orders`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ city: "القاهرة", lines: [] }) });
if (unauthenticatedOrder.status !== 401) { console.error(`FAIL protected orders: expected 401, got ${unauthenticatedOrder.status}`); failed += 1; } else console.log("PASS protected orders");
const unauthenticatedAddresses = await fetch(`${base}/api/addresses`);
if (unauthenticatedAddresses.status !== 401) { console.error(`FAIL protected addresses: expected 401, got ${unauthenticatedAddresses.status}`); failed += 1; } else console.log("PASS protected addresses");
const unauthenticatedMerchantProduct = await fetch(`${base}/api/merchant/products`, { method: "POST", headers: { "content-type": "application/json" }, body: "{}" });
if (unauthenticatedMerchantProduct.status !== 401) { console.error(`FAIL protected merchant product API: expected 401, got ${unauthenticatedMerchantProduct.status}`); failed += 1; } else console.log("PASS protected merchant product API");
const analytics = await fetch(`${base}/api/events`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ event: "product_view", properties: { source: "smoke" } }) });
if (analytics.status !== 200 || !(await analytics.json()).persisted) { console.error(`FAIL persisted analytics: expected 200 persisted, got ${analytics.status}`); failed += 1; } else console.log("PASS persisted analytics");
if (failed) { console.error(`${failed} smoke checks failed`); process.exit(1); }
console.log("All smoke checks passed");
