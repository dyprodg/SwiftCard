import { test, expect } from "../fixtures/auth-test";
import { isOnSignInPage } from "../fixtures/helpers";

test.describe("Gift Card Balance Check (Authenticated)", () => {
  test("balance check page accessible when authenticated", async ({ page }) => {
    const response = await page.goto("/de/gift-cards/check-balance");
    if (response?.status() === 404) {
      test.skip(true, "Gift cards feature is disabled");
      return;
    }
    if (await isOnSignInPage(page)) {
      test.skip(true, "Auth not configured");
      return;
    }
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("balance check form has input and button", async ({ page }) => {
    const response = await page.goto("/de/gift-cards/check-balance");
    if (response?.status() === 404) {
      test.skip(true, "Gift cards feature is disabled");
      return;
    }

    // Verify form elements exist
    const codeInput = page.locator("input").first();
    await expect(codeInput).toBeVisible();

    const checkBtn = page.getByRole("button", { name: /prüfen|check/i });
    await expect(checkBtn).toBeVisible();
  });
});
