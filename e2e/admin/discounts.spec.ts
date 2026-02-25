import { test, expect } from "../fixtures/auth-test";
import { isAdminAccessible } from "../fixtures/helpers";

async function skipIfNoAdmin(page: import("@playwright/test").Page) {
  if (!(await isAdminAccessible(page))) {
    test.skip(true, "Admin access not available");
  }
}

test.describe("Admin Discounts", () => {
  test("discounts list loads", async ({ page, serverErrors }) => {
    await page.goto("/de/admin/discounts");
    await skipIfNoAdmin(page);
    await expect(page.getByRole("heading", { name: /Rabatte|Discounts/i })).toBeVisible();
    expect(serverErrors).toHaveLength(0);
  });

  test("has create discount button", async ({ page }) => {
    await page.goto("/de/admin/discounts");
    await skipIfNoAdmin(page);
    // Button text: "Rabatt hinzufügen" / "Add Discount"
    await expect(
      page
        .getByRole("link", { name: /hinzufügen|erstellen|create|add|neu|new/i })
        .or(page.getByRole("button", { name: /hinzufügen|erstellen|create|add/i })),
    ).toBeVisible();
  });

  test("new discount page loads", async ({ page, serverErrors }) => {
    await page.goto("/de/admin/discounts/new");
    await skipIfNoAdmin(page);
    await expect(page.locator("main")).toBeVisible();
    expect(serverErrors).toHaveLength(0);
  });

  test("discount form has code field", async ({ page }) => {
    await page.goto("/de/admin/discounts/new");
    await skipIfNoAdmin(page);
    await expect(page.locator("input").first()).toBeVisible({ timeout: 5000 });
  });
});
