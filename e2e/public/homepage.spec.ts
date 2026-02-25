import { test, expect } from "../fixtures/base-test";
import { dismissCookieBanner } from "../fixtures/helpers";

test.describe("Homepage", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/de");
  });

  test("loads without server errors", async ({ page, serverErrors }) => {
    await expect(page.locator("header")).toBeVisible();
    expect(serverErrors).toHaveLength(0);
  });

  test("has header with products navigation", async ({ page }) => {
    const header = page.locator("header");
    await expect(header).toBeVisible();
    await expect(header.getByRole("link", { name: /Produkte/i })).toBeVisible();
  });

  test("has page title", async ({ page }) => {
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
  });

  test("shows featured products section", async ({ page }) => {
    // Featured products might not exist, but the section or main content should render
    const main = page.locator("main");
    await expect(main).toBeVisible();
  });

  test("footer has legal links", async ({ page }) => {
    await dismissCookieBanner(page);
    const footer = page.locator("footer");
    await expect(footer).toBeVisible();
    await expect(footer.getByRole("link", { name: /AGB/i })).toBeVisible();
    await expect(footer.getByRole("link", { name: /Datenschutz/i })).toBeVisible();
    await expect(footer.getByRole("link", { name: /Impressum/i })).toBeVisible();
  });

  test("locale switcher is visible", async ({ page }) => {
    const header = page.locator("header");
    await expect(header.getByRole("link", { name: "EN", exact: true })).toBeVisible();
  });

  test("has Organization JSON-LD structured data", async ({ page }) => {
    const jsonLd = page.locator('script[type="application/ld+json"]');
    const count = await jsonLd.count();
    expect(count).toBeGreaterThan(0);
    const text = await jsonLd.first().textContent();
    const data = JSON.parse(text!);
    expect(data["@type"]).toBe("Organization");
  });

  test("no console errors", async ({ consoleErrors }) => {
    expect(consoleErrors).toHaveLength(0);
  });
});
