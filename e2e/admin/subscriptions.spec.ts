import { test, expect } from "../fixtures/auth-test";
import { isAdminAccessible } from "../fixtures/helpers";

async function skipIfNoAdmin(page: import("@playwright/test").Page) {
  if (!(await isAdminAccessible(page))) {
    test.skip(true, "Admin access not available");
  }
}

test.describe("Admin Subscriptions", () => {
  test("subscriptions page loads", async ({ page, serverErrors }) => {
    await page.goto("/de/admin/subscriptions");
    await skipIfNoAdmin(page);
    await expect(
      page.getByRole("heading", { name: /Abonnement|Subscription/i }),
    ).toBeVisible();
    expect(serverErrors).toHaveLength(0);
  });

  test("has create plan button", async ({ page }) => {
    await page.goto("/de/admin/subscriptions");
    await skipIfNoAdmin(page);
    await expect(
      page.getByRole("link", { name: /erstellen|create|neu|new/i }),
    ).toBeVisible();
  });

  test("new plan page loads", async ({ page, serverErrors }) => {
    await page.goto("/de/admin/subscriptions/plans/new");
    await skipIfNoAdmin(page);
    await expect(page.locator("main")).toBeVisible();
    expect(serverErrors).toHaveLength(0);
  });
});
