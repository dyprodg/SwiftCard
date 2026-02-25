import { test, expect } from "../fixtures/auth-test";
import { isOnSignInPage } from "../fixtures/helpers";

test.describe("Address Book", () => {
  test("addresses page loads", async ({ page, serverErrors }) => {
    await page.goto("/de/account/addresses");
    if (await isOnSignInPage(page)) {
      test.skip(true, "Auth not configured");
      return;
    }
    await expect(
      page.getByRole("heading", { name: /Adressen|Addresses/i }),
    ).toBeVisible();
    expect(serverErrors).toHaveLength(0);
  });

  test("has add address button", async ({ page }) => {
    await page.goto("/de/account/addresses");
    if (await isOnSignInPage(page)) {
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
    if (await isOnSignInPage(page)) {
      test.skip(true, "Auth not configured");
      return;
    }

    const addBtn = page
      .getByRole("button", { name: /hinzufügen|add/i })
      .or(page.getByRole("link", { name: /hinzufügen|add/i }));
    await addBtn.click();

    await expect(page.getByLabel(/Name/i).first()).toBeVisible({ timeout: 3000 });
  });
});
