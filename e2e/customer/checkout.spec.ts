import { test, expect } from "../fixtures/base-test";

test.describe("Authenticated Checkout", () => {
  test("checkout page loads for authenticated user", async ({ page, serverErrors }) => {
    await page.goto("/de/checkout");
    if (page.url().includes("sign-in")) {
      test.skip(true, "Auth not configured");
      return;
    }
    expect(serverErrors).toHaveLength(0);
  });

  test("checkout shows shipping form", async ({ page }) => {
    // First add a product to cart
    await page.goto("/de/products");
    const productLinks = page.locator('a[href*="/de/products/"]');
    if ((await productLinks.count()) === 0) {
      test.skip(true, "No products in database");
      return;
    }

    await productLinks.first().click();
    await page.waitForURL(/\/de\/products\/.+/);

    // Select variant if needed
    const sizeButtons = page.locator("button").filter({ hasText: /^(S|M|L|XL)$/ });
    if ((await sizeButtons.count()) > 0) {
      await sizeButtons.first().click();
    }

    await page
      .locator("main")
      .getByRole("button", { name: /Warenkorb/i })
      .click();
    await page.waitForTimeout(1000);

    // Go to checkout
    await page.goto("/de/checkout");
    if (page.url().includes("sign-in")) {
      test.skip(true, "Auth not configured");
      return;
    }

    // Shipping form should be visible
    await expect(
      page.locator('input[name="name"]').or(page.getByLabel(/Name/i)),
    ).toBeVisible({ timeout: 5000 });
  });

  test("checkout has country selector", async ({ page }) => {
    await page.goto("/de/checkout");
    if (page.url().includes("sign-in")) {
      test.skip(true, "Auth not configured");
      return;
    }
    // Country selector should exist
    await expect(
      page.locator('select[name="country"]').or(page.getByLabel(/Land|Country/i)),
    ).toBeVisible({ timeout: 5000 });
  });
});
