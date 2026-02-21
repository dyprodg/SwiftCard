import { test, expect } from "@playwright/test";

test.describe("404 Not Found", () => {
  test("shows 404 page for invalid route (DE)", async ({ page }) => {
    await page.goto("/de/this-page-does-not-exist");
    await expect(
      page.getByRole("heading", { name: /Seite nicht gefunden/i }),
    ).toBeVisible();
  });

  test("shows 404 page for invalid route (EN)", async ({ page }) => {
    await page.goto("/en/this-page-does-not-exist");
    await expect(page.getByRole("heading", { name: /Page Not Found/i })).toBeVisible();
  });

  test("has a link back to home", async ({ page }) => {
    await page.goto("/de/this-page-does-not-exist");
    const homeLink = page.getByRole("link", { name: /Startseite|Zur Startseite/i });
    await expect(homeLink).toBeVisible();
  });
});
