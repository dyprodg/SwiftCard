import { test, expect } from "../fixtures/base-test";

function skipIfNoAuth(page: import("@playwright/test").Page) {
  if (page.url().includes("sign-in")) {
    test.skip(true, "Admin auth not configured");
  }
}

test.describe("Admin Bundles", () => {
  test("bundles list loads", async ({ page, serverErrors }) => {
    await page.goto("/de/admin/bundles");
    skipIfNoAuth(page);
    await expect(page.getByRole("heading", { name: /Pakete|Bundles/i })).toBeVisible();
    expect(serverErrors).toHaveLength(0);
  });

  test("has create bundle button", async ({ page }) => {
    await page.goto("/de/admin/bundles");
    skipIfNoAuth(page);
    await expect(
      page.getByRole("link", { name: /erstellen|create|neu|new/i }),
    ).toBeVisible();
  });

  test("new bundle page loads", async ({ page, serverErrors }) => {
    await page.goto("/de/admin/bundles/new");
    skipIfNoAuth(page);
    await expect(page.locator("main")).toBeVisible();
    expect(serverErrors).toHaveLength(0);
  });
});
