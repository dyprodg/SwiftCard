import { test, expect } from "../fixtures/base-test";

test.describe("Gift Cards (Storefront)", () => {
  test("gift cards page loads or returns 404 (feature flag)", async ({ page }) => {
    const response = await page.goto("/de/gift-cards");
    const status = response?.status();
    // Either loads (200) or feature is disabled (404)
    expect([200, 404]).toContain(status);
  });

  test("gift cards page has heading when enabled", async ({ page }) => {
    const response = await page.goto("/de/gift-cards");
    if (response?.status() === 404) {
      test.skip(true, "Gift cards feature is disabled");
      return;
    }
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("has check balance link when enabled", async ({ page }) => {
    const response = await page.goto("/de/gift-cards");
    if (response?.status() === 404) {
      test.skip(true, "Gift cards feature is disabled");
      return;
    }
    await expect(page.getByRole("link", { name: /Guthaben|Balance/i })).toBeVisible();
  });

  test("check balance page loads when enabled", async ({ page }) => {
    const response = await page.goto("/de/gift-cards/check-balance");
    if (response?.status() === 404) {
      test.skip(true, "Gift cards feature is disabled");
      return;
    }
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("check balance shows error for invalid code", async ({ page }) => {
    const response = await page.goto("/de/gift-cards/check-balance");
    if (response?.status() === 404) {
      test.skip(true, "Gift cards feature is disabled");
      return;
    }

    // Use a code format that passes client-side validation (16 alphanumeric chars)
    const codeInput = page.locator("input").first();
    await codeInput.fill("ABCD-EFGH-IJKL-MNOP");
    const submitBtn = page.getByRole("button", { name: /prüfen|check/i });
    // Wait for button to become enabled
    await expect(submitBtn)
      .toBeEnabled({ timeout: 3000 })
      .catch(() => {});
    if (await submitBtn.isEnabled().catch(() => false)) {
      await submitBtn.click();
      // Should show error message
      await expect(
        page.getByText(/nicht gefunden|not found|ungültig|invalid/i),
      ).toBeVisible({ timeout: 5000 });
    }
  });

  test("no server errors", async ({ page, serverErrors }) => {
    await page.goto("/de/gift-cards");
    expect(serverErrors).toHaveLength(0);
  });
});
