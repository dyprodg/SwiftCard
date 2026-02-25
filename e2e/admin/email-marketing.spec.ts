import { test, expect } from "../fixtures/auth-test";
import { isAdminAccessible } from "../fixtures/helpers";

async function skipIfNoAdmin(page: import("@playwright/test").Page) {
  if (!(await isAdminAccessible(page))) {
    test.skip(true, "Admin access not available");
  }
}

test.describe("Admin Email Marketing", () => {
  test("campaigns list loads", async ({ page, serverErrors }) => {
    await page.goto("/de/admin/email-marketing");
    await skipIfNoAdmin(page);
    await expect(
      page.getByRole("heading", { name: /Kampagnen|Campaigns|E-Mail|Email/i }),
    ).toBeVisible();
    expect(serverErrors).toHaveLength(0);
  });

  test("has create campaign button", async ({ page }) => {
    await page.goto("/de/admin/email-marketing");
    await skipIfNoAdmin(page);
    await expect(
      page.getByRole("link", { name: /erstellen|create|neu|new/i }),
    ).toBeVisible();
  });

  test("new campaign page loads", async ({ page, serverErrors }) => {
    await page.goto("/de/admin/email-marketing/new");
    await skipIfNoAdmin(page);
    await expect(page.locator("main")).toBeVisible();
    expect(serverErrors).toHaveLength(0);
  });

  test("subscribers page loads", async ({ page, serverErrors }) => {
    await page.goto("/de/admin/email-marketing/subscribers");
    await skipIfNoAdmin(page);
    await expect(page.locator("main")).toBeVisible();
    expect(serverErrors).toHaveLength(0);
  });
});
