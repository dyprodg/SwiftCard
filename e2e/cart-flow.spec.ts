import { test, expect } from "@playwright/test";

test.describe("Cart page", () => {
  test("shows empty cart message", async ({ page }) => {
    // Clear any persisted cart by clearing localStorage
    await page.goto("/de/cart");
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await expect(page.getByText(/Warenkorb ist leer|leer/i)).toBeVisible();
  });

  test("has continue shopping link", async ({ page }) => {
    await page.goto("/de/cart");
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await expect(page.getByRole("link", { name: /einkaufen|Produkte/i })).toBeVisible();
  });
});

test.describe("Product to cart flow", () => {
  test("products page lists products and can click into detail", async ({ page }) => {
    await page.goto("/de/products");
    // Wait for the product grid to load
    const productLinks = page.locator('a[href*="/de/products/"]');
    const count = await productLinks.count();

    if (count === 0) {
      test.skip(true, "No products in database — skipping product detail test");
      return;
    }

    // Click first product
    await productLinks.first().click();
    await expect(page).toHaveURL(/\/de\/products\/.+/);
    // Product detail page should have the product name as heading
    await expect(page.locator("h1")).toBeVisible();
  });

  test("product detail page shows add to cart button", async ({ page }) => {
    await page.goto("/de/products");
    const productLinks = page.locator('a[href*="/de/products/"]');
    const count = await productLinks.count();

    if (count === 0) {
      test.skip(true, "No products in database");
      return;
    }

    await productLinks.first().click();
    await expect(page.getByRole("button", { name: /Warenkorb/i })).toBeVisible();
  });
});
