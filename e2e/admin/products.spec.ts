import { test, expect } from "../fixtures/auth-test";
import { isAdminAccessible } from "../fixtures/helpers";

async function skipIfNoAdmin(page: import("@playwright/test").Page) {
  if (!(await isAdminAccessible(page))) {
    test.skip(true, "Admin access not available");
  }
}

test.describe("Admin Products", () => {
  test("products list loads", async ({ page, serverErrors }) => {
    await page.goto("/de/admin/products");
    await skipIfNoAdmin(page);
    await expect(page.getByRole("heading", { name: /Produkte|Products/i })).toBeVisible();
    expect(serverErrors).toHaveLength(0);
  });

  test("has create product button", async ({ page }) => {
    await page.goto("/de/admin/products");
    await skipIfNoAdmin(page);
    await expect(
      page.getByRole("link", { name: /erstellen|create|neu|new|hinzufügen|add/i }),
    ).toBeVisible();
  });

  test("new product page loads", async ({ page, serverErrors }) => {
    await page.goto("/de/admin/products/new");
    await skipIfNoAdmin(page);
    await expect(page.locator("h1, h2").first()).toBeVisible();
    expect(serverErrors).toHaveLength(0);
  });

  test("product form has required fields", async ({ page }) => {
    await page.goto("/de/admin/products/new");
    await skipIfNoAdmin(page);
    // Product form should have name, price fields at minimum
    await expect(
      page.locator('input[name="name"]').or(page.getByLabel(/Name/i).first()),
    ).toBeVisible({ timeout: 5000 });
  });

  test("import page loads", async ({ page, serverErrors }) => {
    await page.goto("/de/admin/products/import");
    await skipIfNoAdmin(page);
    await expect(page.locator("main")).toBeVisible();
    expect(serverErrors).toHaveLength(0);
  });

  test("can navigate to edit page if products exist", async ({ page }) => {
    await page.goto("/de/admin/products");
    await skipIfNoAdmin(page);

    const editLinks = page.locator('a[href*="/admin/products/"][href*="/edit"]');
    if ((await editLinks.count()) === 0) {
      test.skip(true, "No products to edit");
      return;
    }

    await editLinks.first().click();
    await expect(page).toHaveURL(/\/admin\/products\/.*\/edit/);
    await expect(page.locator("main")).toBeVisible();
  });
});
