import { test, expect } from "../fixtures/base-test";

test.describe("Products Page", () => {
  test("loads with heading", async ({ page, serverErrors }) => {
    await page.goto("/de/products");
    await expect(page.getByRole("heading", { name: /Produkte/i })).toBeVisible();
    expect(serverErrors).toHaveLength(0);
  });

  test("has page title", async ({ page }) => {
    await page.goto("/de/products");
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
  });

  test("does not have noindex meta", async ({ page }) => {
    await page.goto("/de/products");
    const robotsMeta = page.locator('meta[name="robots"]');
    const count = await robotsMeta.count();
    if (count > 0) {
      const content = await robotsMeta.getAttribute("content");
      expect(content).not.toContain("noindex");
    }
  });

  test("product cards link to detail pages", async ({ page }) => {
    await page.goto("/de/products");
    const productLinks = page.locator('a[href*="/de/products/"]');
    const count = await productLinks.count();

    if (count === 0) {
      test.skip(true, "No products in database");
      return;
    }

    // First product card links to a detail page
    const href = await productLinks.first().getAttribute("href");
    expect(href).toMatch(/\/de\/products\/.+/);
  });

  test("clicking product navigates to detail", async ({ page }) => {
    await page.goto("/de/products");
    const productLinks = page.locator('a[href*="/de/products/"]');
    const count = await productLinks.count();

    if (count === 0) {
      test.skip(true, "No products in database");
      return;
    }

    await productLinks.first().click();
    await expect(page).toHaveURL(/\/de\/products\/.+/);
    await expect(page.locator("h1")).toBeVisible();
  });

  test("loads in English", async ({ page }) => {
    await page.goto("/en/products");
    await expect(page.getByRole("heading", { name: /Products/i })).toBeVisible();
  });
});
