import { test, expect } from "../fixtures/base-test";

function skipIfNoAuth(page: import("@playwright/test").Page) {
  if (page.url().includes("sign-in")) {
    test.skip(true, "Admin auth not configured");
  }
}

test.describe("Admin Settings", () => {
  test("general settings page loads", async ({ page, serverErrors }) => {
    await page.goto("/de/admin/settings/general");
    skipIfNoAuth(page);
    await expect(page.locator("main")).toBeVisible();
    expect(serverErrors).toHaveLength(0);
  });

  test("payment settings page loads", async ({ page, serverErrors }) => {
    await page.goto("/de/admin/settings/payment");
    skipIfNoAuth(page);
    await expect(page.locator("main")).toBeVisible();
    expect(serverErrors).toHaveLength(0);
  });

  test("legal settings page loads", async ({ page, serverErrors }) => {
    await page.goto("/de/admin/settings/legal");
    skipIfNoAuth(page);
    await expect(page.locator("main")).toBeVisible();
    expect(serverErrors).toHaveLength(0);
  });

  test("banner settings page loads", async ({ page, serverErrors }) => {
    await page.goto("/de/admin/settings/banner");
    skipIfNoAuth(page);
    await expect(page.locator("main")).toBeVisible();
    expect(serverErrors).toHaveLength(0);
  });

  test("reservation settings page loads", async ({ page, serverErrors }) => {
    await page.goto("/de/admin/settings/reservations");
    skipIfNoAuth(page);
    await expect(page.locator("main")).toBeVisible();
    expect(serverErrors).toHaveLength(0);
  });

  test("return settings page loads", async ({ page, serverErrors }) => {
    await page.goto("/de/admin/settings/returns");
    skipIfNoAuth(page);
    await expect(page.locator("main")).toBeVisible();
    expect(serverErrors).toHaveLength(0);
  });

  test("feature flags page loads", async ({ page, serverErrors }) => {
    await page.goto("/de/admin/settings/features");
    skipIfNoAuth(page);
    await expect(page.locator("main")).toBeVisible();
    expect(serverErrors).toHaveLength(0);
  });

  test("feature flags has toggle switches", async ({ page }) => {
    await page.goto("/de/admin/settings/features");
    skipIfNoAuth(page);
    // Should have switches for bundles, gift cards, subscriptions
    const switches = page.locator('button[role="switch"]');
    const count = await switches.count();
    expect(count).toBeGreaterThanOrEqual(3);
  });

  test("settings has tab navigation", async ({ page }) => {
    await page.goto("/de/admin/settings/general");
    skipIfNoAuth(page);
    // Should have multiple settings tabs
    await expect(
      page.getByRole("link", { name: /Allgemein|General/i }).first(),
    ).toBeVisible();
  });
});
