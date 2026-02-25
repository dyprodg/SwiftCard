import { test, expect } from "../fixtures/base-test";
import { clearCart } from "../fixtures/helpers";

test.describe("Checkout Guards", () => {
  test("checkout page has noindex", async ({ page }) => {
    await page.goto("/de/checkout");
    const robots = page.locator('meta[name="robots"]');
    await expect(robots).toHaveAttribute("content", /noindex/);
  });

  test("empty cart on checkout shows empty state or redirect", async ({ page }) => {
    await page.goto("/de/checkout");
    await clearCart(page);
    // Should either redirect to cart or show empty cart message
    await expect(
      page.getByText(/leer|empty/i).or(page.locator('a[href*="/cart"]')),
    ).toBeVisible({ timeout: 5000 });
  });

  test("no server errors", async ({ page, serverErrors }) => {
    await page.goto("/de/checkout");
    expect(serverErrors).toHaveLength(0);
  });
});
