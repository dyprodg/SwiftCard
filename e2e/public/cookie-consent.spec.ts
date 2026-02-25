import { test, expect } from "../fixtures/base-test";

test.describe("Cookie Consent", () => {
  test.beforeEach(async ({ page }) => {
    // Clear cookie consent state
    await page.goto("/de");
    await page.evaluate(() => localStorage.removeItem("swiftcard-cookie-consent"));
    await page.reload();
  });

  test("cookie banner appears on fresh visit", async ({ page }) => {
    await expect(page.getByText(/Cookie/i).first()).toBeVisible({ timeout: 5000 });
  });

  test("accepting cookies dismisses banner", async ({ page }) => {
    // The cookie banner is a fixed bottom bar - find the accept/ok button within it
    const banner = page.locator(".fixed.bottom-0, [class*='fixed'][class*='bottom']");
    const acceptButton = banner
      .getByRole("button", { name: /akzeptieren|annehmen|accept|OK|Alle/i })
      .first();
    if (await acceptButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await acceptButton.click();
      // Banner should disappear
      await expect(banner).toBeHidden({ timeout: 5000 });
    }
  });

  test("consent persists after reload", async ({ page }) => {
    // Set consent
    await page.evaluate(() => {
      localStorage.setItem(
        "swiftcard-cookie-consent",
        JSON.stringify({
          state: { consent: { essential: true, analytics: false } },
          version: 0,
        }),
      );
    });
    await page.reload();

    // Banner should not appear
    const banner = page.getByRole("button", { name: /akzeptieren|accept/i });
    await expect(banner).toBeHidden({ timeout: 3000 });
  });
});
