import { test, expect } from "../fixtures/auth-test";
import { isOnSignInPage } from "../fixtures/helpers";

test.describe("Authenticated Checkout", () => {
  test("checkout page loads for authenticated user", async ({ page, serverErrors }) => {
    await page.goto("/de/checkout");
    if (await isOnSignInPage(page)) {
      test.skip(true, "Auth not configured");
      return;
    }
    expect(serverErrors).toHaveLength(0);
  });

  test("checkout shows shipping form when cart has items", async ({ page }) => {
    // First add a product to cart
    await page.goto("/de/products");
    const productLinks = page.locator('a[href*="/de/products/"]');
    if ((await productLinks.count()) === 0) {
      test.skip(true, "No products in database");
      return;
    }

    await productLinks.first().click();
    await page.waitForURL(/\/de\/products\/.+/);

    const sizeButtons = page.locator("button").filter({ hasText: /^(S|M|L|XL)$/ });
    if ((await sizeButtons.count()) > 0) {
      await sizeButtons.first().click();
    }

    await page
      .locator("main")
      .getByRole("button", { name: /Warenkorb/i })
      .click();
    await page.waitForTimeout(1000);

    await page.goto("/de/checkout");
    if (await isOnSignInPage(page)) {
      test.skip(true, "Auth not configured");
      return;
    }

    // Checkout heading should be visible
    await expect(page.getByRole("heading", { name: /Kasse|Checkout/i })).toBeVisible({
      timeout: 5000,
    });
  });
});
