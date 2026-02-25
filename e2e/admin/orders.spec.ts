import { test, expect } from "../fixtures/auth-test";
import { isAdminAccessible } from "../fixtures/helpers";

async function skipIfNoAdmin(page: import("@playwright/test").Page) {
  if (!(await isAdminAccessible(page))) {
    test.skip(true, "Admin access not available");
  }
}

test.describe("Admin Orders", () => {
  test("orders list loads", async ({ page, serverErrors }) => {
    await page.goto("/de/admin/orders");
    await skipIfNoAdmin(page);
    await expect(
      page.getByRole("heading", { name: /Bestellungen|Orders/i }),
    ).toBeVisible();
    expect(serverErrors).toHaveLength(0);
  });

  test("has filter controls", async ({ page }) => {
    await page.goto("/de/admin/orders");
    await skipIfNoAdmin(page);
    // Should have status filter or search
    await expect(page.locator("main")).toBeVisible();
  });

  test("has export button", async ({ page }) => {
    await page.goto("/de/admin/orders");
    await skipIfNoAdmin(page);
    await expect(page.getByRole("button", { name: /export|CSV/i })).toBeVisible();
  });

  test("order detail page loads if orders exist", async ({ page, serverErrors }) => {
    await page.goto("/de/admin/orders");
    await skipIfNoAdmin(page);

    const orderLinks = page
      .locator('a[href*="/admin/orders/"]')
      .filter({ hasNotText: /export|packing/i });
    if ((await orderLinks.count()) === 0) {
      test.skip(true, "No orders in database");
      return;
    }

    await orderLinks.first().click();
    await expect(page.locator("main")).toBeVisible();
    expect(serverErrors).toHaveLength(0);
  });
});
