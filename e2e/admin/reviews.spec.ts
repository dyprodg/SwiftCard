import { test, expect } from "../fixtures/auth-test";
import { isAdminAccessible } from "../fixtures/helpers";

async function skipIfNoAdmin(page: import("@playwright/test").Page) {
  if (!(await isAdminAccessible(page))) {
    test.skip(true, "Admin access not available");
  }
}

test.describe("Admin Reviews", () => {
  test("reviews page loads", async ({ page, serverErrors }) => {
    await page.goto("/de/admin/reviews");
    await skipIfNoAdmin(page);
    await expect(
      page.getByRole("heading", { name: /Bewertungen|Reviews/i }),
    ).toBeVisible();
    expect(serverErrors).toHaveLength(0);
  });

  test("shows reviews table or empty state", async ({ page }) => {
    await page.goto("/de/admin/reviews");
    await skipIfNoAdmin(page);
    await expect(page.locator("main")).toBeVisible();
  });
});
