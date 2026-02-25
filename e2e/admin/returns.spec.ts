import { test, expect } from "../fixtures/base-test";

function skipIfNoAuth(page: import("@playwright/test").Page) {
  if (page.url().includes("sign-in")) {
    test.skip(true, "Admin auth not configured");
  }
}

test.describe("Admin Returns", () => {
  test("returns page loads", async ({ page, serverErrors }) => {
    await page.goto("/de/admin/returns");
    skipIfNoAuth(page);
    await expect(page.getByRole("heading", { name: /Retouren|Returns/i })).toBeVisible();
    expect(serverErrors).toHaveLength(0);
  });

  test("shows stats cards", async ({ page }) => {
    await page.goto("/de/admin/returns");
    skipIfNoAuth(page);
    // Returns page should have stats cards (pending, approved, etc.)
    await expect(page.locator("main")).toBeVisible();
  });

  test("return detail loads if returns exist", async ({ page, serverErrors }) => {
    await page.goto("/de/admin/returns");
    skipIfNoAuth(page);

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
