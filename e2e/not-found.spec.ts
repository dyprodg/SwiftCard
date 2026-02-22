import { test, expect } from "@playwright/test";

test.describe("404 Not Found", () => {
  test("shows 404 page for invalid route (DE)", async ({ page }) => {
    const response = await page.goto("/de/this-page-does-not-exist");
    // Next.js should return 404 status
    expect(response?.status()).toBe(404);
  });

  test("shows 404 page for invalid route (EN)", async ({ page }) => {
    const response = await page.goto("/en/this-page-does-not-exist");
    expect(response?.status()).toBe(404);
  });

  test("404 page has heading", async ({ page }) => {
    await page.goto("/de/this-page-does-not-exist");
    // The not-found page uses h2 with translated text
    const heading = page.locator("h2");
    await expect(heading).toBeVisible();
  });
});
