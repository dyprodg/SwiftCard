import { test, expect } from "../fixtures/base-test";

function skipIfNoAuth(page: import("@playwright/test").Page) {
  if (page.url().includes("sign-in")) {
    test.skip(true, "Admin auth not configured");
  }
}

test.describe("Admin Customers", () => {
  test("customers list loads", async ({ page, serverErrors }) => {
    await page.goto("/de/admin/customers");
    skipIfNoAuth(page);
    await expect(page.getByRole("heading", { name: /Kunden|Customers/i })).toBeVisible();
    expect(serverErrors).toHaveLength(0);
  });

  test("shows customer table or empty state", async ({ page }) => {
    await page.goto("/de/admin/customers");
    skipIfNoAuth(page);
    await expect(page.locator("main")).toBeVisible();
  });

  test("customer detail loads if customers exist", async ({ page, serverErrors }) => {
    await page.goto("/de/admin/customers");
    skipIfNoAuth(page);

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
