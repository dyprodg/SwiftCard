import { test, expect } from "../fixtures/base-test";

function skipIfNoAuth(page: import("@playwright/test").Page) {
  if (page.url().includes("sign-in")) {
    test.skip(true, "Admin auth not configured");
  }
}

test.describe("Admin Discounts", () => {
  test("discounts list loads", async ({ page, serverErrors }) => {
    await page.goto("/de/admin/discounts");
    skipIfNoAuth(page);
    await expect(page.getByRole("heading", { name: /Rabatte|Discounts/i })).toBeVisible();
    expect(serverErrors).toHaveLength(0);
  });

  test("has create discount button", async ({ page }) => {
    await page.goto("/de/admin/discounts");
    skipIfNoAuth(page);
    await expect(
      page.getByRole("link", { name: /erstellen|create|neu|new/i }),
    ).toBeVisible();
  });

  test("new discount page loads", async ({ page, serverErrors }) => {
    await page.goto("/de/admin/discounts/new");
    skipIfNoAuth(page);
    await expect(page.locator("main")).toBeVisible();
    expect(serverErrors).toHaveLength(0);
  });

  test("discount form has code field", async ({ page }) => {
    await page.goto("/de/admin/discounts/new");
    skipIfNoAuth(page);
    await expect(page.locator("input").first()).toBeVisible({ timeout: 5000 });
  });
});
