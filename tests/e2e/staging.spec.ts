import { expect, test } from "@playwright/test";

const publicRoutes = [
  "/",
  "/shop",
  "/fabrics",
  "/categories",
  "/categories/evening",
  "/tailors",
  "/visualizer",
  "/assistant",
  "/auth",
  "/auth/signup",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/favorites",
  "/cart",
  "/checkout",
  "/guide",
  "/privacy",
  "/terms",
];

test("critical public routes respond successfully", async ({ request }) => {
  for (const route of publicRoutes) {
    const response = await request.get(route);
    expect(response.status(), route).toBe(200);
  }
});

test("health endpoint reports database readiness", async ({ request }) => {
  const response = await request.get("/api/health");
  const body = await response.json();
  if (process.env.E2E_ALLOW_DEGRADED !== "true") expect(response.status()).toBe(200);
  expect(body.service).toBe("saleh");
  expect(body.checks.database).toBe(true);
  expect(typeof body.latencyMs).toBe("number");
});

test("protected mutations reject anonymous callers", async ({ request }) => {
  const order = await request.post("/api/orders", { data: { city: "القاهرة", district: "المعادي", addressLine: "عنوان اختبار", phone: "01012345678", lines: [] } });
  expect(order.status()).toBe(401);
  expect((await request.get("/api/addresses")).status()).toBe(401);
  const product = await request.post("/api/merchant/products", { data: {} });
  expect(product.status()).toBe(401);
});

test("mobile navigation works without horizontal overflow", async ({ page }) => {
  const browserErrors: string[] = [];
  page.on("pageerror", (error) => browserErrors.push(error.message));
  page.on("console", (message) => { if (message.type() === "error") browserErrors.push(message.text()); });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await expect(page.getByRole("button", { name: "فتح القائمة" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await page.getByRole("button", { name: "فتح القائمة" }).click();
  await expect(page.locator(".home-v2-mobile-menu")).toBeVisible();
  await page.locator('.home-v2-mobile-menu a[href="/categories"]').click();
  await expect(page).toHaveURL(/\/categories$/);
  expect(browserErrors).toEqual([]);
});

test("catalog does not expose fake product data", async ({ page }) => {
  await page.goto("/shop");
  const body = await page.locator("body").innerText();
  expect(body).not.toMatch(/سعر تجريبي|منتج تجريبي|placeholder/i);
});

test("configured staging product opens the fabric ID flow", async ({ page }) => {
  test.skip(!process.env.STAGING_PRODUCT_SLUG, "Set STAGING_PRODUCT_SLUG to run the real product flow against staging data");
  await page.goto(`/fabrics/${process.env.STAGING_PRODUCT_SLUG}`);
  await expect(page.getByRole("heading", { name: /المنتج غير متاح/ })).toHaveCount(0);
  await page.getByRole("button", { name: /اختاري هتعملي إيه/ }).click();
  await expect(page.getByRole("heading", { name: "هتعملي إيه بالقماش؟" })).toBeVisible();
  await expect(page.getByRole("link", { name: /أشتري القماش فقط/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /أعمل فستان أو قطعة/ })).toBeVisible();
});

test("configured staging customer can authenticate", async ({ page }) => {
  test.skip(!process.env.STAGING_TEST_EMAIL || !process.env.STAGING_TEST_PASSWORD, "Set STAGING_TEST_EMAIL and STAGING_TEST_PASSWORD for authenticated staging E2E");
  await page.goto("/auth?next=/account");
  await page.getByLabel("البريد الإلكتروني").fill(process.env.STAGING_TEST_EMAIL!);
  await page.getByLabel("كلمة المرور").fill(process.env.STAGING_TEST_PASSWORD!);
  await page.getByRole("button", { name: /تسجيل الدخول/ }).click();
  await expect(page).toHaveURL(/\/account$/);
  await expect(page.getByRole("heading", { name: /بياناتك محفوظة/ })).toBeVisible();
});
