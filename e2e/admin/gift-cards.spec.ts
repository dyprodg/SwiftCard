import { test, expect } from "../fixtures/auth-test";
import { isAdminAccessible } from "../fixtures/helpers";

async function skipIfNoAdmin(page: import("@playwright/test").Page) {
  if (!(await isAdminAccessible(page))) {
    test.skip(true, "Admin access not available");
  }
}

test.describe("Admin Gift Cards", () => {
  test("gift cards list loads", async ({ page, serverErrors }) => {
    await page.goto("/de/admin/gift-cards");
    await skipIfNoAdmin(page);
    await expect(
      page.getByRole("heading", { name: /Geschenkkarten|Gift Cards/i }),
    ).toBeVisible();
    expect(serverErrors).toHaveLength(0);
  });

  test("has create gift card button", async ({ page }) => {
    await page.goto("/de/admin/gift-cards");
    await skipIfNoAdmin(page);
    // Button uses t("admin.giftCards.issue") text
    await expect(
      page
        .getByRole("link", { name: /ausstellen|erstellen|issue|create|neu|new/i })
        .or(page.getByRole("button", { name: /ausstellen|erstellen|issue|create/i })),
    ).toBeVisible();
  });

  test("new gift card page loads", async ({ page, serverErrors }) => {
    await page.goto("/de/admin/gift-cards/new");
    await skipIfNoAdmin(page);
    await expect(page.locator("main")).toBeVisible();
    expect(serverErrors).toHaveLength(0);
  });

  test("gift card form has balance field", async ({ page }) => {
    await page.goto("/de/admin/gift-cards/new");
    await skipIfNoAdmin(page);
    await expect(page.locator('input[type="number"]').first()).toBeVisible({
      timeout: 5000,
    });
  });

  test("gift card form has recipient email", async ({ page }) => {
    await page.goto("/de/admin/gift-cards/new");
    await skipIfNoAdmin(page);
    await expect(page.locator('input[type="email"]').first()).toBeVisible({
      timeout: 5000,
    });
  });

  test("gift card form has send email toggle", async ({ page }) => {
    await page.goto("/de/admin/gift-cards/new");
    await skipIfNoAdmin(page);
    await expect(page.locator('button[role="switch"]').first()).toBeVisible({
      timeout: 5000,
    });
  });

  test("gift card detail page loads if cards exist", async ({ page, serverErrors }) => {
    await page.goto("/de/admin/gift-cards");
    await skipIfNoAdmin(page);

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
