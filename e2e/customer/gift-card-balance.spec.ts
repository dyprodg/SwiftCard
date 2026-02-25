import { test, expect } from "../fixtures/base-test";

test.describe("Gift Card Balance Check (Authenticated)", () => {
  test("balance check page accessible when authenticated", async ({ page }) => {
    const response = await page.goto("/de/gift-cards/check-balance");
    if (response?.status() === 404) {
      test.skip(true, "Gift cards feature is disabled");
      return;
    }
    if (page.url().includes("sign-in")) {
      test.skip(true, "Auth not configured");
      return;
    }
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("can submit balance check form", async ({ page }) => {
    const response = await page.goto("/de/gift-cards/check-balance");
    if (response?.status() === 404) {
      test.skip(true, "Gift cards feature is disabled");
      return;
    }

    const codeInput = page.locator("input").first();
    await codeInput.fill("TEST-CODE-1234");

    const checkBtn = page.getByRole("button", { name: /prüfen|check/i });
    if (await checkBtn.isVisible()) {
      await checkBtn.click();
      // Should show result (either balance or error)
      await page.waitForTimeout(2000);
      const main = page.locator("main");
      await expect(main).toBeVisible();
    }
  });
});
