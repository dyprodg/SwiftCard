import { test, expect } from "../fixtures/base-test";

function skipIfNoAuth(page: import("@playwright/test").Page) {
  if (page.url().includes("sign-in")) {
    test.skip(true, "Admin auth not configured");
  }
}

test.describe("Admin Subscriptions", () => {
  test("subscriptions page loads", async ({ page, serverErrors }) => {
    await page.goto("/de/admin/subscriptions");
    skipIfNoAuth(page);
    await expect(
      page.getByRole("heading", { name: /Abonnement|Subscription/i }),
    ).toBeVisible();
    expect(serverErrors).toHaveLength(0);
  });

  test("has create plan button", async ({ page }) => {
    await page.goto("/de/admin/subscriptions");
    skipIfNoAuth(page);
    await expect(
      page.getByRole("link", { name: /erstellen|create|neu|new/i }),
    ).toBeVisible();
  });

  test("new plan page loads", async ({ page, serverErrors }) => {
    await page.goto("/de/admin/subscriptions/plans/new");
    skipIfNoAuth(page);
    await expect(page.locator("main")).toBeVisible();
    expect(serverErrors).toHaveLength(0);
  });
});
