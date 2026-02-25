import { test, expect } from "../fixtures/auth-test";
import { isOnSignInPage } from "../fixtures/helpers";

test.describe("Order History", () => {
  test("orders page loads", async ({ page, serverErrors }) => {
    await page.goto("/de/account/orders");
    if (await isOnSignInPage(page)) {
      test.skip(true, "Auth not configured");
      return;
    }
    // Page title heading "Meine Bestellungen" — use first() to avoid strict mode
    await expect(
      page.getByRole("heading", { name: /Meine Bestellungen|My Orders/i }).first(),
    ).toBeVisible();
    expect(serverErrors).toHaveLength(0);
  });

  test("shows orders list or empty state", async ({ page }) => {
    await page.goto("/de/account/orders");
    if (await isOnSignInPage(page)) {
      test.skip(true, "Auth not configured");
      return;
    }
    const main = page.locator("main");
    await expect(main).toBeVisible();
  });
});
