import { test, expect } from "../fixtures/auth-test";
import { isAdminAccessible } from "../fixtures/helpers";

async function skipIfNoAdmin(page: import("@playwright/test").Page) {
  if (!(await isAdminAccessible(page))) {
    test.skip(true, "Admin access not available");
  }
}

test.describe("Admin Dashboard", () => {
  test("dashboard loads with heading", async ({ page, serverErrors }) => {
    await page.goto("/de/admin/dashboard");
    await skipIfNoAdmin(page);
    await expect(page.getByRole("heading", { name: /Dashboard/i })).toBeVisible();
    expect(serverErrors).toHaveLength(0);
  });

  test("shows metric cards", async ({ page }) => {
    await page.goto("/de/admin/dashboard");
    await skipIfNoAdmin(page);
    // Metric cards: Gesamtumsatz, Bestellungen gesamt, etc.
    await expect(page.getByText(/Gesamtumsatz|Total Revenue/i).first()).toBeVisible();
    await expect(page.getByText(/Bestellungen|Orders/i).first()).toBeVisible();
  });

  test("shows recent orders table", async ({ page }) => {
    await page.goto("/de/admin/dashboard");
    await skipIfNoAdmin(page);
    await expect(page.getByText(/Neueste Bestellungen|Recent Orders/i)).toBeVisible();
  });

  test("has low stock alerts section", async ({ page }) => {
    await page.goto("/de/admin/dashboard");
    await skipIfNoAdmin(page);
    await expect(
      page.getByText(/Lagerbestandswarnungen|Low Stock/i).first(),
    ).toBeVisible();
  });

  test("has sidebar navigation", async ({ page }) => {
    await page.goto("/de/admin/dashboard");
    await skipIfNoAdmin(page);
    await expect(
      page.getByRole("link", { name: /Produkte|Products/i }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /Bestellungen|Orders/i }).first(),
    ).toBeVisible();
  });
});
