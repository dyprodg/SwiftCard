import { test, expect } from "../fixtures/auth-test";
import { isAdminAccessible } from "../fixtures/helpers";

async function skipIfNoAdmin(page: import("@playwright/test").Page) {
  if (!(await isAdminAccessible(page))) {
    test.skip(true, "Admin access not available");
  }
}

test.describe("Admin Customers", () => {
  test("customers list loads", async ({ page, serverErrors }) => {
    await page.goto("/de/admin/customers");
    await skipIfNoAdmin(page);
    await expect(page.getByRole("heading", { name: /Kunden|Customers/i })).toBeVisible();
    expect(serverErrors).toHaveLength(0);
  });

  test("shows customer table or empty state", async ({ page }) => {
    await page.goto("/de/admin/customers");
    await skipIfNoAdmin(page);
    await expect(page.locator("main")).toBeVisible();
  });

  test("customer detail loads if customers exist", async ({ page, serverErrors }) => {
    await page.goto("/de/admin/customers");
    await skipIfNoAdmin(page);

    const customerLinks = page.locator('a[href*="/admin/customers/"]');
    if ((await customerLinks.count()) === 0) {
      test.skip(true, "No customers in database");
      return;
    }

    await customerLinks.first().click();
    await expect(page.locator("main")).toBeVisible();
    expect(serverErrors).toHaveLength(0);
  });
});
