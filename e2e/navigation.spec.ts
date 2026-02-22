import { test, expect } from "@playwright/test";

// Dismiss cookie banner by setting consent in localStorage before the page hydrates
async function dismissCookieBanner(page: import("@playwright/test").Page) {
  await page.evaluate(() => {
    localStorage.setItem(
      "swiftcard-cookie-consent",
      JSON.stringify({
        state: { consent: { essential: true, analytics: false } },
        version: 0,
      }),
    );
  });
  await page.reload();
}

test.describe("Header navigation", () => {
  test("header is visible and sticky", async ({ page }) => {
    await page.goto("/de");
    const header = page.locator("header");
    await expect(header).toBeVisible();
  });

  test("logo/shop name links to home", async ({ page }) => {
    await page.goto("/de/products");
    const header = page.locator("header");
    const homeLink = header.getByRole("link").first();
    await homeLink.click();
    await expect(page).toHaveURL(/\/de$/);
  });

  test("products link navigates to products page", async ({ page }) => {
    await page.goto("/de");
    const header = page.locator("header");
    await header.getByRole("link", { name: /Produkte/i }).click();
    await expect(page).toHaveURL(/\/de\/products/);
  });

  test("locale switcher is visible in header", async ({ page }) => {
    await page.goto("/de");
    const header = page.locator("header");
    await expect(header.getByRole("link", { name: "EN", exact: true })).toBeVisible();
  });
});

test.describe("Footer navigation", () => {
  test("footer is visible on homepage", async ({ page }) => {
    await page.goto("/de");
    const footer = page.locator("footer");
    await expect(footer).toBeVisible();
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

  test("cookie settings button is visible in footer", async ({ page }) => {
    await page.goto("/de");
    await dismissCookieBanner(page);
    const footer = page.locator("footer");
    await expect(footer.getByRole("button", { name: /Cookie/i })).toBeVisible();
  });
});

test.describe("Cross-page navigation", () => {
  test("can navigate from products back to home via logo", async ({ page }) => {
    await page.goto("/de/products");
    const header = page.locator("header");
    await header.getByRole("link").first().click();
    await expect(page).toHaveURL(/\/de$/);
  });

  test("legal pages have consistent header and footer", async ({ page }) => {
    for (const path of ["/de/terms", "/de/privacy", "/de/imprint"]) {
      await page.goto(path);
      await expect(page.locator("header")).toBeVisible();
      await expect(page.locator("footer")).toBeVisible();
    }
  });
});
