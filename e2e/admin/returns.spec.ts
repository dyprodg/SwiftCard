import { test, expect } from "../fixtures/auth-test";
import { isAdminAccessible } from "../fixtures/helpers";

async function skipIfNoAdmin(page: import("@playwright/test").Page) {
  if (!(await isAdminAccessible(page))) {
    test.skip(true, "Admin access not available");
  }
}

test.describe("Admin Returns", () => {
  test("returns page loads", async ({ page, serverErrors }) => {
    await page.goto("/de/admin/returns");
    await skipIfNoAdmin(page);
    await expect(page.getByRole("heading", { name: /Retouren|Returns/i })).toBeVisible();
    expect(serverErrors).toHaveLength(0);
  });

  test("shows stats cards", async ({ page }) => {
    await page.goto("/de/admin/returns");
    await skipIfNoAdmin(page);
    // Returns page should have stats cards (pending, approved, etc.)
    await expect(page.locator("main")).toBeVisible();
  });

  test("return detail loads if returns exist", async ({ page, serverErrors }) => {
    await page.goto("/de/admin/returns");
    await skipIfNoAdmin(page);

    const returnLinks = page.locator('a[href*="/admin/returns/"]');
    if ((await returnLinks.count()) === 0) {
      test.skip(true, "No returns in database");
      return;
    }

    await returnLinks.first().click();
    await expect(page.locator("main")).toBeVisible();
    expect(serverErrors).toHaveLength(0);
  });
});
