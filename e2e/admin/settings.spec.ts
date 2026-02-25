import { test, expect } from "../fixtures/auth-test";
import { isAdminAccessible } from "../fixtures/helpers";

async function skipIfNoAdmin(page: import("@playwright/test").Page) {
  if (!(await isAdminAccessible(page))) {
    test.skip(true, "Admin access not available");
  }
}

test.describe("Admin Settings", () => {
  test("general settings page loads", async ({ page, serverErrors }) => {
    await page.goto("/de/admin/settings/general");
    await skipIfNoAdmin(page);
    await expect(page.locator("main")).toBeVisible();
    expect(serverErrors).toHaveLength(0);
  });

  test("payment settings page loads", async ({ page, serverErrors }) => {
    await page.goto("/de/admin/settings/payment");
    await skipIfNoAdmin(page);
    await expect(page.locator("main")).toBeVisible();
    expect(serverErrors).toHaveLength(0);
  });

  test("legal settings page loads", async ({ page, serverErrors }) => {
    await page.goto("/de/admin/settings/legal");
    await skipIfNoAdmin(page);
    await expect(page.locator("main")).toBeVisible();
    expect(serverErrors).toHaveLength(0);
  });

  test("banner settings page loads", async ({ page, serverErrors }) => {
    await page.goto("/de/admin/settings/banner");
    await skipIfNoAdmin(page);
    await expect(page.locator("main")).toBeVisible();
    expect(serverErrors).toHaveLength(0);
  });

  test("reservation settings page loads", async ({ page, serverErrors }) => {
    await page.goto("/de/admin/settings/reservations");
    await skipIfNoAdmin(page);
    await expect(page.locator("main")).toBeVisible();
    expect(serverErrors).toHaveLength(0);
  });

  test("return settings page loads", async ({ page, serverErrors }) => {
    await page.goto("/de/admin/settings/returns");
    await skipIfNoAdmin(page);
    await expect(page.locator("main")).toBeVisible();
    expect(serverErrors).toHaveLength(0);
  });

  test("feature flags page loads", async ({ page, serverErrors }) => {
    await page.goto("/de/admin/settings/features");
    await skipIfNoAdmin(page);
    await expect(page.locator("main")).toBeVisible();
    expect(serverErrors).toHaveLength(0);
  });

  test("feature flags has toggle switches", async ({ page }) => {
    await page.goto("/de/admin/settings/features");
    await skipIfNoAdmin(page);
    // Should have switches for bundles, gift cards, subscriptions
    const switches = page.locator('button[role="switch"]');
    const count = await switches.count();
    expect(count).toBeGreaterThanOrEqual(3);
  });

  test("settings has tab navigation", async ({ page }) => {
    await page.goto("/de/admin/settings/general");
    await skipIfNoAdmin(page);
    // Should have multiple settings tabs
    await expect(
      page.getByRole("link", { name: /Allgemein|General/i }).first(),
    ).toBeVisible();
  });
});
