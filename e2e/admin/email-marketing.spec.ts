import { test, expect } from "../fixtures/base-test";

function skipIfNoAuth(page: import("@playwright/test").Page) {
  if (page.url().includes("sign-in")) {
    test.skip(true, "Admin auth not configured");
  }
}

test.describe("Admin Email Marketing", () => {
  test("campaigns list loads", async ({ page, serverErrors }) => {
    await page.goto("/de/admin/email-marketing");
    skipIfNoAuth(page);
    await expect(
      page.getByRole("heading", { name: /Kampagnen|Campaigns|E-Mail|Email/i }),
    ).toBeVisible();
    expect(serverErrors).toHaveLength(0);
  });

  test("has create campaign button", async ({ page }) => {
    await page.goto("/de/admin/email-marketing");
    skipIfNoAuth(page);
    await expect(
      page.getByRole("link", { name: /erstellen|create|neu|new/i }),
    ).toBeVisible();
  });

  test("new campaign page loads", async ({ page, serverErrors }) => {
    await page.goto("/de/admin/email-marketing/new");
    skipIfNoAuth(page);
    await expect(page.locator("main")).toBeVisible();
    expect(serverErrors).toHaveLength(0);
  });

  test("subscribers page loads", async ({ page, serverErrors }) => {
    await page.goto("/de/admin/email-marketing/subscribers");
    skipIfNoAuth(page);
    await expect(page.locator("main")).toBeVisible();
    expect(serverErrors).toHaveLength(0);
  });
});
