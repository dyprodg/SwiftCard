import { test, expect } from "../fixtures/base-test";

test.describe("Order History", () => {
  test("orders page loads", async ({ page, serverErrors }) => {
    await page.goto("/de/account/orders");
    if (page.url().includes("sign-in")) {
      test.skip(true, "Auth not configured");
      return;
    }
    await expect(
      page.getByRole("heading", { name: /Bestellungen|Orders/i }),
    ).toBeVisible();
    expect(serverErrors).toHaveLength(0);
  });

  test("shows orders list or empty state", async ({ page }) => {
    await page.goto("/de/account/orders");
    if (page.url().includes("sign-in")) {
      test.skip(true, "Auth not configured");
      return;
    }
    // Either shows orders or empty state message
    const main = page.locator("main");
    await expect(main).toBeVisible();
    // Should have either order items or "no orders" message
    await expect(
      page
        .getByText(/keine Bestellungen|no orders|ORD-/i)
        .first()
        .or(page.locator('a[href*="/order/"]').first()),
    ).toBeVisible({ timeout: 5000 });
  });
});
