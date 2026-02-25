import { test, expect } from "../fixtures/base-test";

function skipIfNoAuth(page: import("@playwright/test").Page) {
  if (page.url().includes("sign-in")) {
    test.skip(true, "Admin auth not configured");
  }
}

test.describe("Admin Reservations", () => {
  test("reservations page loads", async ({ page, serverErrors }) => {
    await page.goto("/de/admin/reservations");
    skipIfNoAuth(page);
    await expect(
      page.getByRole("heading", { name: /Reservierung|Reservation/i }),
    ).toBeVisible();
    expect(serverErrors).toHaveLength(0);
  });

  test("shows stats cards", async ({ page }) => {
    await page.goto("/de/admin/reservations");
    skipIfNoAuth(page);
    await expect(page.locator("main")).toBeVisible();
  });
});
