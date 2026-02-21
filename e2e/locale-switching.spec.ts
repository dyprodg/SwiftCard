import { test, expect } from "@playwright/test";

test.describe("Locale switching", () => {
  test("switches from DE to EN on homepage", async ({ page }) => {
    await page.goto("/de");
    // Click the locale switcher to switch to English
    await page.getByRole("link", { name: /EN/i }).click();
    await expect(page).toHaveURL(/\/en/);
    // Verify English content
    await expect(page.getByRole("link", { name: /Products/i })).toBeVisible();
  });

  test("switches from EN to DE on homepage", async ({ page }) => {
    await page.goto("/en");
    await page.getByRole("link", { name: /DE/i }).click();
    await expect(page).toHaveURL(/\/de/);
    await expect(page.getByRole("link", { name: /Produkte/i })).toBeVisible();
  });

  test("preserves path when switching on products page", async ({ page }) => {
    await page.goto("/de/products");
    await page.getByRole("link", { name: /EN/i }).click();
    await expect(page).toHaveURL(/\/en\/products/);
  });

  test("preserves path when switching on terms page", async ({ page }) => {
    await page.goto("/en/terms");
    await page.getByRole("link", { name: /DE/i }).click();
    await expect(page).toHaveURL(/\/de\/terms/);
  });

  test("default locale DE redirects / to /de", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/de/);
  });
});
