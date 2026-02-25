import { test, expect } from "../fixtures/auth-test";
import { isOnSignInPage } from "../fixtures/helpers";

test.describe("Account Overview", () => {
  test("account page loads", async ({ page, serverErrors }) => {
    const response = await page.goto("/de/account");
    if (await isOnSignInPage(page)) {
      test.skip(true, "Auth not configured or 2FA required");
      return;
    }
    expect(response?.status()).toBeLessThan(400);
    expect(serverErrors).toHaveLength(0);
  });

  test("shows welcome message", async ({ page }) => {
    await page.goto("/de/account");
    if (await isOnSignInPage(page)) {
      test.skip(true, "Auth not configured");
      return;
    }
    await expect(page.getByText(/Willkommen|Welcome/i)).toBeVisible();
  });

  test("shows recent orders card", async ({ page }) => {
    await page.goto("/de/account");
    if (await isOnSignInPage(page)) {
      test.skip(true, "Auth not configured");
      return;
    }
    await expect(
      page.getByText(/Letzte Bestellungen|Recent Orders/i).first(),
    ).toBeVisible();
  });

  test("shows address card", async ({ page }) => {
    await page.goto("/de/account");
    if (await isOnSignInPage(page)) {
      test.skip(true, "Auth not configured");
      return;
    }
    await expect(
      page.getByText(/Standardadresse|Default Address/i).first(),
    ).toBeVisible();
  });

  test("has navigation sidebar", async ({ page }) => {
    await page.goto("/de/account");
    if (await isOnSignInPage(page)) {
      test.skip(true, "Auth not configured");
      return;
    }
    await expect(
      page.getByRole("link", { name: /Bestellungen|Orders/i }).first(),
    ).toBeVisible();
  });
});
