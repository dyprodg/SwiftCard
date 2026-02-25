import { test, expect } from "../fixtures/base-test";

function skipIfNoAuth(page: import("@playwright/test").Page) {
  if (page.url().includes("sign-in")) {
    test.skip(true, "Admin auth not configured");
  }
}

test.describe("Admin Dashboard", () => {
  test("dashboard loads with heading", async ({ page, serverErrors }) => {
    await page.goto("/de/admin/dashboard");
    skipIfNoAuth(page);
    await expect(page.getByRole("heading", { name: /Dashboard/i })).toBeVisible();
    expect(serverErrors).toHaveLength(0);
  });

  test("shows metric cards", async ({ page }) => {
    await page.goto("/de/admin/dashboard");
    skipIfNoAuth(page);
    // Should have revenue, orders, etc. metrics
    await expect(page.getByText(/Umsatz|Revenue/i).first()).toBeVisible();
    await expect(page.getByText(/Bestellungen|Orders/i).first()).toBeVisible();
  });

  test("shows recent orders table", async ({ page }) => {
    await page.goto("/de/admin/dashboard");
    skipIfNoAuth(page);
    await expect(page.getByText(/Letzte Bestellungen|Recent Orders/i)).toBeVisible();
  });

  test("has maintenance toggle", async ({ page }) => {
    await page.goto("/de/admin/dashboard");
    skipIfNoAuth(page);
    // Maintenance toggle button/switch should be visible
    await expect(page.getByText(/Wartung|Maintenance/i).first()).toBeVisible();
  });

  test("has sidebar navigation", async ({ page }) => {
    await page.goto("/de/admin/dashboard");
    skipIfNoAuth(page);
    // Admin sidebar should have key navigation items
    await expect(
      page.getByRole("link", { name: /Produkte|Products/i }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /Bestellungen|Orders/i }).first(),
    ).toBeVisible();
  });
});
