import { test, expect } from "../fixtures/auth-test";
import { isOnSignInPage } from "../fixtures/helpers";

test.describe("Wishlist", () => {
  test("wishlist page loads", async ({ page, serverErrors }) => {
    await page.goto("/de/wishlist");
    if (await isOnSignInPage(page)) {
      test.skip(true, "Auth not configured");
      return;
    }
    await expect(
      page.getByRole("heading", { name: /Wunschliste|Wishlist/i }),
    ).toBeVisible();
    expect(serverErrors).toHaveLength(0);
  });

  test("shows wishlist items or empty state", async ({ page }) => {
    await page.goto("/de/wishlist");
    if (await isOnSignInPage(page)) {
      test.skip(true, "Auth not configured");
      return;
    }
    const main = page.locator("main");
    await expect(main).toBeVisible();
  });

  test("wishlist icon visible in header when authenticated", async ({ page }) => {
    await page.goto("/de");
    if (await isOnSignInPage(page)) {
      test.skip(true, "Auth not configured");
      return;
    }
    const header = page.locator("header");
    await expect(header.locator('a[href*="/wishlist"]')).toBeVisible();
  });
});
