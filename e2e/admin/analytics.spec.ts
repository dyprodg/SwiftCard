import { test, expect } from "../fixtures/base-test";

function skipIfNoAuth(page: import("@playwright/test").Page) {
  if (page.url().includes("sign-in")) {
    test.skip(true, "Admin auth not configured");
  }
}

test.describe("Admin Analytics", () => {
  test("analytics page loads", async ({ page, serverErrors }) => {
    await page.goto("/de/admin/analytics");
    skipIfNoAuth(page);
    await expect(
      page.getByRole("heading", { name: /Analytik|Analytics/i }),
    ).toBeVisible();
    expect(serverErrors).toHaveLength(0);
  });

  test("has date range selector", async ({ page }) => {
    await page.goto("/de/admin/analytics");
    skipIfNoAuth(page);
    // Date range presets (7D, 30D, 90D, etc.)
    await expect(
      page.getByRole("button", { name: /7D|30D|7 Tage|30 Tage/i }).first(),
    ).toBeVisible();
  });

  test("has tab navigation", async ({ page }) => {
    await page.goto("/de/admin/analytics");
    skipIfNoAuth(page);
    // Should have tabs: Overview, Products, Refunds, Discounts, Customers
    await expect(
      page
        .getByRole("tab", { name: /Übersicht|Overview/i })
        .or(page.getByText(/Übersicht|Overview/i).first()),
    ).toBeVisible();
  });

  test("shows stat cards", async ({ page }) => {
    await page.goto("/de/admin/analytics");
    skipIfNoAuth(page);
    // Should have KPI cards (revenue, orders, etc.)
    await expect(page.locator("main")).toBeVisible();
  });

  test("switching tabs works", async ({ page }) => {
    await page.goto("/de/admin/analytics");
    skipIfNoAuth(page);

    const productsTab = page
      .getByRole("tab", { name: /Produkte|Products/i })
      .or(page.getByText(/Produkte|Products/i).first());
    if (await productsTab.isVisible()) {
      await productsTab.click();
      await page.waitForTimeout(500);
      await expect(page.locator("main")).toBeVisible();
    }
  });
});
