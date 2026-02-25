import { test, expect } from "../fixtures/base-test";
import { dismissCookieBanner } from "../fixtures/helpers";

test.describe("Header Navigation", () => {
  test("header is visible", async ({ page }) => {
    await page.goto("/de");
    await expect(page.locator("header")).toBeVisible();
  });

  test("logo links to home", async ({ page }) => {
    await page.goto("/de/products");
    const header = page.locator("header");
    await header.getByRole("link").first().click();
    await expect(page).toHaveURL(/\/de$/);
  });

  test("products link navigates to products page", async ({ page }) => {
    await page.goto("/de");
    const header = page.locator("header");
    await header.getByRole("link", { name: /Produkte/i }).click();
    await expect(page).toHaveURL(/\/de\/products/);
  });

  test("locale switcher is visible", async ({ page }) => {
    await page.goto("/de");
    const header = page.locator("header");
    await expect(header.getByRole("link", { name: "EN", exact: true })).toBeVisible();
  });

  test("cart icon is visible in header", async ({ page }) => {
    await page.goto("/de");
    const header = page.locator("header");
    // Cart button/icon should be present
    await expect(
      header
        .locator("button, a")
        .filter({ has: page.locator("svg") })
        .last(),
    ).toBeVisible();
  });
});

test.describe("Footer Navigation", () => {
  test("footer is visible on homepage", async ({ page }) => {
    await page.goto("/de");
    await expect(page.locator("footer")).toBeVisible();
  });

  test("terms link navigates to terms page", async ({ page }) => {
    await page.goto("/de");
    await dismissCookieBanner(page);
    const footer = page.locator("footer");
    await footer.getByRole("link", { name: /AGB/i }).click();
    await expect(page).toHaveURL(/\/de\/terms/);
  });

  test("privacy link navigates to privacy page", async ({ page }) => {
    await page.goto("/de");
    await dismissCookieBanner(page);
    const footer = page.locator("footer");
    await footer.getByRole("link", { name: /Datenschutz/i }).click();
    await expect(page).toHaveURL(/\/de\/privacy/);
  });

  test("imprint link navigates to imprint page", async ({ page }) => {
    await page.goto("/de");
    await dismissCookieBanner(page);
    const footer = page.locator("footer");
    await footer.getByRole("link", { name: /Impressum/i }).click();
    await expect(page).toHaveURL(/\/de\/imprint/);
  });

  test("cookie settings button is visible", async ({ page }) => {
    await page.goto("/de");
    await dismissCookieBanner(page);
    const footer = page.locator("footer");
    await expect(footer.getByRole("button", { name: /Cookie/i })).toBeVisible();
  });
});

test.describe("Cross-page Navigation", () => {
  test("can navigate from products back to home", async ({ page }) => {
    await page.goto("/de/products");
    const header = page.locator("header");
    await header.getByRole("link").first().click();
    await expect(page).toHaveURL(/\/de$/);
  });
});
