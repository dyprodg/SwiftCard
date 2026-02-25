import { test, expect } from "../fixtures/base-test";

function skipIfNoAuth(page: import("@playwright/test").Page) {
  if (page.url().includes("sign-in")) {
    test.skip(true, "Admin auth not configured");
  }
}

test.describe("Admin Shipping Zones", () => {
  test("shipping page loads", async ({ page, serverErrors }) => {
    await page.goto("/de/admin/shipping");
    skipIfNoAuth(page);
    await expect(page.getByRole("heading", { name: /Versand|Shipping/i })).toBeVisible();
    expect(serverErrors).toHaveLength(0);
  });

  test("has create shipping zone button", async ({ page }) => {
    await page.goto("/de/admin/shipping");
    skipIfNoAuth(page);
    await expect(
      page
        .getByRole("link", { name: /erstellen|create|neu|new|hinzufügen|add/i })
        .or(page.getByRole("button", { name: /erstellen|create|neu|new|laden|load/i })),
    ).toBeVisible();
  });

  test("new shipping zone page loads", async ({ page, serverErrors }) => {
    await page.goto("/de/admin/shipping/new");
    skipIfNoAuth(page);
    await expect(page.locator("main")).toBeVisible();
    expect(serverErrors).toHaveLength(0);
  });
});

test.describe("Admin Tax Zones", () => {
  test("tax page loads", async ({ page, serverErrors }) => {
    await page.goto("/de/admin/tax");
    skipIfNoAuth(page);
    await expect(page.getByRole("heading", { name: /Steuer|Tax/i })).toBeVisible();
    expect(serverErrors).toHaveLength(0);
  });

  test("shows tax zones or empty state", async ({ page }) => {
    await page.goto("/de/admin/tax");
    skipIfNoAuth(page);
    await expect(page.locator("main")).toBeVisible();
  });
});
