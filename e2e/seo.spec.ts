import { test, expect } from "@playwright/test";

test.describe("SEO meta tags", () => {
  test("homepage has a title", async ({ page }) => {
    await page.goto("/de");
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
  });

  test("products page has a title", async ({ page }) => {
    await page.goto("/de/products");
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
  });

  test("terms page has correct title", async ({ page }) => {
    await page.goto("/de/terms");
    const title = await page.title();
    expect(title).toContain("Geschäftsbedingungen");
  });

  test("privacy page has correct title", async ({ page }) => {
    await page.goto("/de/privacy");
    const title = await page.title();
    expect(title).toContain("Datenschutz");
  });

  test("EN terms page has English title", async ({ page }) => {
    await page.goto("/en/terms");
    const title = await page.title();
    expect(title).toContain("Terms");
  });
});

test.describe("Robots meta", () => {
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
    const robotsContent = await page
      .locator('meta[name="robots"]')
      .getAttribute("content");
    // Should either not exist or not contain noindex
    if (robotsContent) {
      expect(robotsContent).not.toContain("noindex");
    }
  });
});

test.describe("JSON-LD structured data", () => {
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
