import { test, expect } from "../fixtures/auth-test";
import { isAdminAccessible } from "../fixtures/helpers";

async function skipIfNoAdmin(page: import("@playwright/test").Page) {
  if (!(await isAdminAccessible(page))) {
    test.skip(true, "Admin access not available");
  }
}

test.describe("Admin Draft Orders", () => {
  test("draft orders list loads", async ({ page, serverErrors }) => {
    await page.goto("/de/admin/draft-orders");
    await skipIfNoAdmin(page);
    await expect(
      page.getByRole("heading", { name: /Entwurfsbestellungen|Entwürfe|Draft/i }),
    ).toBeVisible();
    expect(serverErrors).toHaveLength(0);
  });

  test("has create draft order button", async ({ page }) => {
    await page.goto("/de/admin/draft-orders");
    await skipIfNoAdmin(page);
    await expect(
      page.getByRole("link", { name: /erstellen|create|neu|new/i }),
    ).toBeVisible();
  });

  test("new draft order page loads", async ({ page, serverErrors }) => {
    await page.goto("/de/admin/draft-orders/new");
    await skipIfNoAdmin(page);
    await expect(page.locator("main")).toBeVisible();
    expect(serverErrors).toHaveLength(0);
  });
});
