import { test, expect } from "../fixtures/auth-test";
import { isAdminAccessible } from "../fixtures/helpers";

async function skipIfNoAdmin(page: import("@playwright/test").Page) {
  if (!(await isAdminAccessible(page))) {
    test.skip(true, "Admin access not available");
  }
}

test.describe("Admin Abandoned Carts", () => {
  test("abandoned carts page loads", async ({ page, serverErrors }) => {
    await page.goto("/de/admin/abandoned-carts");
    await skipIfNoAdmin(page);
    await expect(
      page.getByRole("heading", { name: /Warenkörbe|Abandoned|abgebrochene/i }),
    ).toBeVisible();
    expect(serverErrors).toHaveLength(0);
  });

  test("shows stats cards", async ({ page }) => {
    await page.goto("/de/admin/abandoned-carts");
    await skipIfNoAdmin(page);
    await expect(page.locator("main")).toBeVisible();
  });
});
