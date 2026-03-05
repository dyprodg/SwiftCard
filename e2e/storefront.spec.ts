import { test, expect } from "@playwright/test";

// Dismiss cookie banner by setting consent in localStorage
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

test.describe("Storefront", () => {
  test("homepage loads and has products nav link", async ({ page }) => {
    await page.goto("/de");
    await expect(page).toHaveURL(/\/de/);
    const productsLink = page.locator("header").getByRole("link", { name: /Produkte/i });
    await expect(productsLink).toBeVisible();
  });

  test("navigates to products page", async ({ page }) => {
    await page.goto("/de");
    await page
      .locator("header")
      .getByRole("link", { name: /Produkte/i })
      .click();
    await expect(page).toHaveURL(/\/de\/products/);
  });

  test("products page shows heading", async ({ page }) => {
    await page.goto("/de/products");
    await expect(page.getByRole("heading", { name: /Produkte/i })).toBeVisible();
  });

  test("cart page shows heading", async ({ page }) => {
    await page.goto("/de/cart");
    await expect(page.getByRole("heading", { name: /Warenkorb/i })).toBeVisible();
  });
});

test.describe("Legal pages (DE)", () => {
  test("terms page loads", async ({ page }) => {
    await page.goto("/de/terms");
    await expect(
      page.getByRole("heading", { name: /Allgemeine Geschäftsbedingungen/i }),
    ).toBeVisible();
  });

  test("privacy page loads", async ({ page }) => {
    await page.goto("/de/privacy");
    await expect(
      page.getByRole("heading", { name: /Datenschutzerklärung/i }),
    ).toBeVisible();
  });

  test("imprint page loads", async ({ page }) => {
    await page.goto("/de/imprint");
    await expect(page.getByRole("heading", { name: /Impressum/i })).toBeVisible();
  });
});

test.describe("Legal pages (EN)", () => {
  test("terms page loads in English", async ({ page }) => {
    await page.goto("/en/terms");
    await expect(page.getByRole("heading", { name: /Terms of Service/i })).toBeVisible();
  });

  test("privacy page loads in English", async ({ page }) => {
    await page.goto("/en/privacy");
    await expect(page.getByRole("heading", { name: /Privacy Policy/i })).toBeVisible();
  });

  test("imprint page loads in English", async ({ page }) => {
    await page.goto("/en/imprint");
    await expect(page.getByRole("heading", { name: /Imprint/i })).toBeVisible();
  });
});

test.describe("Footer", () => {
  test("contains legal links", async ({ page }) => {
    await page.goto("/de");
    await dismissCookieBanner(page);
    const footer = page.locator("footer");
    await expect(footer.getByRole("link", { name: /AGB/i })).toBeVisible();
    await expect(footer.getByRole("link", { name: /Datenschutz/i })).toBeVisible();
    await expect(footer.getByRole("link", { name: /Impressum/i })).toBeVisible();
  });
});
