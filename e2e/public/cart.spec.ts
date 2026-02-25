import { test, expect } from "../fixtures/base-test";
import { clearCart } from "../fixtures/helpers";

test.describe("Cart", () => {
  test("empty cart shows message", async ({ page }) => {
    await page.goto("/de/cart");
    await clearCart(page);
    await expect(page.getByText(/Warenkorb ist leer|leer/i)).toBeVisible();
  });

  test("has continue shopping link", async ({ page }) => {
    await page.goto("/de/cart");
    await clearCart(page);
    const main = page.locator("main");
    await expect(main.getByRole("link", { name: /einkaufen|Produkte/i })).toBeVisible();
  });

  test("cart page has heading", async ({ page }) => {
    await page.goto("/de/cart");
    await expect(page.getByRole("heading", { name: /Warenkorb/i })).toBeVisible();
  });

  test("cart page has noindex", async ({ page }) => {
    await page.goto("/de/cart");
    const robots = page.locator('meta[name="robots"]');
    await expect(robots).toHaveAttribute("content", /noindex/);
  });

  test("no server errors on empty cart", async ({ page, serverErrors }) => {
    await page.goto("/de/cart");
    expect(serverErrors).toHaveLength(0);
  });
});

test.describe("Cart with product", () => {
  test("adding product opens cart sheet", async ({ page }) => {
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

    const addBtn = page.locator("main").getByRole("button", { name: /Warenkorb/i });
    await addBtn.click();

    // Cart sheet dialog should open after adding
    await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 5000 });
  });
});
