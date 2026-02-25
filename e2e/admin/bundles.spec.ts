import { test, expect } from "../fixtures/auth-test";
import { isAdminAccessible } from "../fixtures/helpers";

async function skipIfNoAdmin(page: import("@playwright/test").Page) {
  if (!(await isAdminAccessible(page))) {
    test.skip(true, "Admin access not available");
  }
}

test.describe("Admin Bundles", () => {
  test("bundles list loads", async ({ page, serverErrors }) => {
    await page.goto("/de/admin/bundles");
    await skipIfNoAdmin(page);
    await expect(page.getByRole("heading", { name: /Pakete|Bundles/i })).toBeVisible();
    expect(serverErrors).toHaveLength(0);
  });

  test("has create bundle button", async ({ page }) => {
    await page.goto("/de/admin/bundles");
    await skipIfNoAdmin(page);
    await expect(
      page.getByRole("link", { name: /erstellen|create|neu|new/i }),
    ).toBeVisible();
  });

  test("new bundle page loads", async ({ page, serverErrors }) => {
    await page.goto("/de/admin/bundles/new");
    await skipIfNoAdmin(page);
    await expect(page.locator("main")).toBeVisible();
    expect(serverErrors).toHaveLength(0);
  });
});
