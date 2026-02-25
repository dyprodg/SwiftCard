import { test, expect } from "../fixtures/base-test";

test.describe("Locale Switching", () => {
  test("switches from DE to EN on homepage", async ({ page }) => {
    await page.goto("/de");
    await page.locator("header").getByRole("link", { name: "EN", exact: true }).click();
    await expect(page).toHaveURL(/\/en/);
    await expect(page.getByRole("link", { name: /Products/i }).first()).toBeVisible();
  });

  test("switches from EN to DE on homepage", async ({ page }) => {
    await page.goto("/en");
    await page.locator("header").getByRole("link", { name: "DE", exact: true }).click();
    await expect(page).toHaveURL(/\/de/);
    await expect(page.getByRole("link", { name: /Produkte/i }).first()).toBeVisible();
  });

  test("preserves path on products page", async ({ page }) => {
    await page.goto("/de/products");
    await page.locator("header").getByRole("link", { name: "EN", exact: true }).click();
    await expect(page).toHaveURL(/\/en\/products/);
  });

  test("preserves path on terms page", async ({ page }) => {
    await page.goto("/en/terms");
    await page.locator("header").getByRole("link", { name: "DE", exact: true }).click();
    await expect(page).toHaveURL(/\/de\/terms/);
  });

  test("root / redirects to a locale", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/(de|en)/);
  });
});
