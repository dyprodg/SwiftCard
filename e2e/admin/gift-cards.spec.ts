import { test, expect } from "../fixtures/base-test";

function skipIfNoAuth(page: import("@playwright/test").Page) {
  if (page.url().includes("sign-in")) {
    test.skip(true, "Admin auth not configured");
  }
}

test.describe("Admin Gift Cards", () => {
  test("gift cards list loads", async ({ page, serverErrors }) => {
    await page.goto("/de/admin/gift-cards");
    skipIfNoAuth(page);
    await expect(
      page.getByRole("heading", { name: /Geschenkkarten|Gift Cards/i }),
    ).toBeVisible();
    expect(serverErrors).toHaveLength(0);
  });

  test("has create gift card button", async ({ page }) => {
    await page.goto("/de/admin/gift-cards");
    skipIfNoAuth(page);
    await expect(
      page.getByRole("link", { name: /erstellen|create|ausstellen|issue|neu|new/i }),
    ).toBeVisible();
  });

  test("new gift card page loads", async ({ page, serverErrors }) => {
    await page.goto("/de/admin/gift-cards/new");
    skipIfNoAuth(page);
    await expect(page.locator("main")).toBeVisible();
    expect(serverErrors).toHaveLength(0);
  });

  test("gift card form has balance field", async ({ page }) => {
    await page.goto("/de/admin/gift-cards/new");
    skipIfNoAuth(page);
    // Should have initial balance input
    await expect(page.locator('input[type="number"]').first()).toBeVisible({
      timeout: 5000,
    });
  });

  test("gift card form has recipient email", async ({ page }) => {
    await page.goto("/de/admin/gift-cards/new");
    skipIfNoAuth(page);
    await expect(page.locator('input[type="email"]').first()).toBeVisible({
      timeout: 5000,
    });
  });

  test("gift card form has send email toggle", async ({ page }) => {
    await page.goto("/de/admin/gift-cards/new");
    skipIfNoAuth(page);
    await expect(page.locator('button[role="switch"]').first()).toBeVisible({
      timeout: 5000,
    });
  });

  test("gift card detail page loads if cards exist", async ({ page, serverErrors }) => {
    await page.goto("/de/admin/gift-cards");
    skipIfNoAuth(page);

    const cardLinks = page
      .locator('a[href*="/admin/gift-cards/"]')
      .filter({ hasNotText: /new|neu/i });
    if ((await cardLinks.count()) === 0) {
      test.skip(true, "No gift cards in database");
      return;
    }

    await cardLinks.first().click();
    await expect(page.locator("main")).toBeVisible();
    expect(serverErrors).toHaveLength(0);
  });
});
