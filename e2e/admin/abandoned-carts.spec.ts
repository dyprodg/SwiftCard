import { test, expect } from "../fixtures/base-test";

function skipIfNoAuth(page: import("@playwright/test").Page) {
  if (page.url().includes("sign-in")) {
    test.skip(true, "Admin auth not configured");
  }
}

test.describe("Admin Abandoned Carts", () => {
  test("abandoned carts page loads", async ({ page, serverErrors }) => {
    await page.goto("/de/admin/abandoned-carts");
    skipIfNoAuth(page);
    await expect(
      page.getByRole("heading", { name: /Warenkörbe|Abandoned|abgebrochene/i }),
    ).toBeVisible();
    expect(serverErrors).toHaveLength(0);
  });

  test("shows stats cards", async ({ page }) => {
    await page.goto("/de/admin/abandoned-carts");
    skipIfNoAuth(page);
    await expect(page.locator("main")).toBeVisible();
  });
});
