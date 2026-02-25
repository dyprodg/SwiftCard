import { test, expect } from "../fixtures/base-test";

test.describe("Account Overview", () => {
  test("account page loads", async ({ page, serverErrors }) => {
    const response = await page.goto("/de/account");
    // If not authenticated, will redirect to sign-in
    if (page.url().includes("sign-in")) {
      test.skip(true, "Auth not configured — skipping authenticated tests");
      return;
    }
    expect(response?.status()).toBeLessThan(400);
    expect(serverErrors).toHaveLength(0);
  });

  test("shows welcome message", async ({ page }) => {
    await page.goto("/de/account");
    if (page.url().includes("sign-in")) {
      test.skip(true, "Auth not configured");
      return;
    }
    await expect(page.getByText(/Willkommen|Welcome/i)).toBeVisible();
  });

  test("shows recent orders card", async ({ page }) => {
    await page.goto("/de/account");
    if (page.url().includes("sign-in")) {
      test.skip(true, "Auth not configured");
      return;
    }
    await expect(page.getByText(/Bestellungen|Orders/i).first()).toBeVisible();
  });

  test("shows address card", async ({ page }) => {
    await page.goto("/de/account");
    if (page.url().includes("sign-in")) {
      test.skip(true, "Auth not configured");
      return;
    }
    await expect(page.getByText(/Adresse|Address/i).first()).toBeVisible();
  });

  test("has navigation sidebar", async ({ page }) => {
    await page.goto("/de/account");
    if (page.url().includes("sign-in")) {
      test.skip(true, "Auth not configured");
      return;
    }
    // Account nav should have links to orders, addresses, etc.
    await expect(
      page.getByRole("link", { name: /Bestellungen|Orders/i }).first(),
    ).toBeVisible();
  });
});
