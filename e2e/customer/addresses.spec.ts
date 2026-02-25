import { test, expect } from "../fixtures/base-test";

test.describe("Address Book", () => {
  test("addresses page loads", async ({ page, serverErrors }) => {
    await page.goto("/de/account/addresses");
    if (page.url().includes("sign-in")) {
      test.skip(true, "Auth not configured");
      return;
    }
    await expect(page.getByRole("heading", { name: /Adress/i })).toBeVisible();
    expect(serverErrors).toHaveLength(0);
  });

  test("has add address button", async ({ page }) => {
    await page.goto("/de/account/addresses");
    if (page.url().includes("sign-in")) {
      test.skip(true, "Auth not configured");
      return;
    }
    await expect(
      page
        .getByRole("button", { name: /hinzufügen|add/i })
        .or(page.getByRole("link", { name: /hinzufügen|add/i })),
    ).toBeVisible();
  });

  test("add address form has required fields", async ({ page }) => {
    await page.goto("/de/account/addresses");
    if (page.url().includes("sign-in")) {
      test.skip(true, "Auth not configured");
      return;
    }

    // Click add address
    const addBtn = page
      .getByRole("button", { name: /hinzufügen|add/i })
      .or(page.getByRole("link", { name: /hinzufügen|add/i }));
    await addBtn.click();

    // Form should appear with name, address, city, zip, country fields
    await expect(
      page.locator('input[name="name"]').or(page.getByLabel(/Name/i)),
    ).toBeVisible({ timeout: 3000 });
  });
});
