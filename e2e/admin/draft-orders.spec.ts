import { test, expect } from "../fixtures/base-test";

function skipIfNoAuth(page: import("@playwright/test").Page) {
  if (page.url().includes("sign-in")) {
    test.skip(true, "Admin auth not configured");
  }
}

test.describe("Admin Draft Orders", () => {
  test("draft orders list loads", async ({ page, serverErrors }) => {
    await page.goto("/de/admin/draft-orders");
    skipIfNoAuth(page);
    await expect(page.getByRole("heading", { name: /Entwürfe|Draft/i })).toBeVisible();
    expect(serverErrors).toHaveLength(0);
  });

  test("has create draft order button", async ({ page }) => {
    await page.goto("/de/admin/draft-orders");
    skipIfNoAuth(page);
    await expect(
      page.getByRole("link", { name: /erstellen|create|neu|new/i }),
    ).toBeVisible();
  });

  test("new draft order page loads", async ({ page, serverErrors }) => {
    await page.goto("/de/admin/draft-orders/new");
    skipIfNoAuth(page);
    await expect(page.locator("main")).toBeVisible();
    expect(serverErrors).toHaveLength(0);
  });
});
