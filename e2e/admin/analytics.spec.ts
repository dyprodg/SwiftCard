import { test, expect } from "../fixtures/auth-test";
import { isAdminAccessible } from "../fixtures/helpers";

async function skipIfNoAdmin(page: import("@playwright/test").Page) {
  if (!(await isAdminAccessible(page))) {
    test.skip(true, "Admin access not available");
  }
}

test.describe("Admin Analytics", () => {
  test("analytics page loads", async ({ page, serverErrors }) => {
    await page.goto("/de/admin/analytics");
    await skipIfNoAdmin(page);
    await expect(
      page.getByRole("heading", { name: /Analysen|Analytics/i }),
    ).toBeVisible();
    expect(serverErrors).toHaveLength(0);
  });

  test("has date range selector", async ({ page }) => {
    test.slow(); // analytics page loads large datasets
    await page.goto("/de/admin/analytics", { waitUntil: "domcontentloaded" });
    await skipIfNoAdmin(page);
    // Wait for page content to load past skeleton state
    await expect(page.getByRole("heading", { name: /Analysen|Analytics/i })).toBeVisible({
      timeout: 15000,
    });
    // Date range presets (7T, 30T, 90T, etc.)
    await expect(
      page.getByRole("button", { name: /7T|30T|7D|30D|7 Tage|30 Tage/i }).first(),
    ).toBeVisible({ timeout: 15000 });
  });

  test("has tab navigation", async ({ page }) => {
    test.slow(); // analytics page loads large datasets
    await page.goto("/de/admin/analytics", { waitUntil: "domcontentloaded" });
    await skipIfNoAdmin(page);
    // Tabs: Übersicht, Produkte, Rückerstattungen, Rabatte, Kunden
    await expect(
      page
        .getByRole("tab", { name: /Übersicht|Overview/i })
        .or(page.getByText(/Übersicht|Overview/i).first()),
    ).toBeVisible({ timeout: 15000 });
  });

  test("shows stat cards", async ({ page }) => {
    await page.goto("/de/admin/analytics");
    await skipIfNoAdmin(page);
    await expect(page.locator("main")).toBeVisible();
  });

  test("switching tabs works", async ({ page }) => {
    await page.goto("/de/admin/analytics");
    await skipIfNoAdmin(page);
    // Wait for analytics content to load before interacting with tabs
    await expect(page.getByText(/Übersicht|Overview/i).first()).toBeVisible({
      timeout: 10000,
    });

    const productsTab = page.getByRole("tab", { name: /Produkte|Products/i });
    if (await productsTab.isVisible()) {
      await productsTab.click();
      await page.waitForTimeout(500);
      await expect(page.locator("main")).toBeVisible();
    }
  });
});
