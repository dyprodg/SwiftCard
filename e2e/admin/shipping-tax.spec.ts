import { test, expect } from "../fixtures/auth-test";
import { isAdminAccessible } from "../fixtures/helpers";

async function skipIfNoAdmin(page: import("@playwright/test").Page) {
  if (!(await isAdminAccessible(page))) {
    test.skip(true, "Admin access not available");
  }
}

test.describe("Admin Shipping Zones", () => {
  test("shipping page loads", async ({ page, serverErrors }) => {
    await page.goto("/de/admin/shipping");
    await skipIfNoAdmin(page);
    await expect(page.getByRole("heading", { name: /Versand|Shipping/i })).toBeVisible();
    expect(serverErrors).toHaveLength(0);
  });

  test("has create shipping zone button", async ({ page }) => {
    await page.goto("/de/admin/shipping");
    await skipIfNoAdmin(page);
    await expect(
      page
        .getByRole("link", { name: /erstellen|create|neu|new|hinzufügen|add/i })
        .or(page.getByRole("button", { name: /erstellen|create|neu|new|laden|load/i })),
    ).toBeVisible();
  });

  test("new shipping zone page loads", async ({ page, serverErrors }) => {
    await page.goto("/de/admin/shipping/new");
    await skipIfNoAdmin(page);
    await expect(page.locator("main")).toBeVisible();
    expect(serverErrors).toHaveLength(0);
  });
});

test.describe("Admin Tax Zones", () => {
  test("tax page loads", async ({ page, serverErrors }) => {
    await page.goto("/de/admin/tax");
    await skipIfNoAdmin(page);
    await expect(page.getByRole("heading", { name: /Steuer|Tax/i })).toBeVisible();
    expect(serverErrors).toHaveLength(0);
  });

  test("shows tax zones or empty state", async ({ page }) => {
    await page.goto("/de/admin/tax");
    await skipIfNoAdmin(page);
    await expect(page.locator("main")).toBeVisible();
  });
});
