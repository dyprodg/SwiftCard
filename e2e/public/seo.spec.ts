import { test, expect } from "../fixtures/base-test";

test.describe("SEO Meta Tags", () => {
  test("homepage has title", async ({ page }) => {
    await page.goto("/de");
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
  });

  test("products page has title", async ({ page }) => {
    await page.goto("/de/products");
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
  });

  test("terms page has correct DE title", async ({ page }) => {
    await page.goto("/de/terms");
    const title = await page.title();
    expect(title).toContain("Geschäftsbedingungen");
  });

  test("privacy page has correct DE title", async ({ page }) => {
    await page.goto("/de/privacy");
    const title = await page.title();
    expect(title).toContain("Datenschutz");
  });

  test("terms page has correct EN title", async ({ page }) => {
    await page.goto("/en/terms");
    const title = await page.title();
    expect(title).toContain("Terms");
  });
});

test.describe("Robots Meta", () => {
  test("cart page has noindex", async ({ page }) => {
    await page.goto("/de/cart");
    const robots = page.locator('meta[name="robots"]');
    await expect(robots).toHaveAttribute("content", /noindex/);
  });

  test("checkout page has noindex", async ({ page }) => {
    await page.goto("/de/checkout");
    const robots = page.locator('meta[name="robots"]');
    await expect(robots).toHaveAttribute("content", /noindex/);
  });

  test("products page does not have noindex", async ({ page }) => {
    await page.goto("/de/products");
    const robotsMeta = page.locator('meta[name="robots"]');
    const count = await robotsMeta.count();
    if (count > 0) {
      const content = await robotsMeta.getAttribute("content");
      expect(content).not.toContain("noindex");
    }
  });
});

test.describe("JSON-LD Structured Data", () => {
  test("homepage has Organization JSON-LD", async ({ page }) => {
    await page.goto("/de");
    const jsonLd = page.locator('script[type="application/ld+json"]');
    const count = await jsonLd.count();
    expect(count).toBeGreaterThan(0);
    const text = await jsonLd.first().textContent();
    const data = JSON.parse(text!);
    expect(data["@type"]).toBe("Organization");
  });
});
