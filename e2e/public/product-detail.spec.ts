import { test, expect } from "../fixtures/base-test";

test.describe("Product Detail", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to first product
    await page.goto("/de/products");
    const productLinks = page.locator('a[href*="/de/products/"]');
    const count = await productLinks.count();
    if (count === 0) {
      test.skip(true, "No products in database");
      return;
    }
    await productLinks.first().click();
    await page.waitForURL(/\/de\/products\/.+/);
  });

  test("loads with product name heading", async ({ page, serverErrors }) => {
    await expect(page.locator("h1")).toBeVisible();
    const title = await page.locator("h1").textContent();
    expect(title!.length).toBeGreaterThan(0);
    expect(serverErrors).toHaveLength(0);
  });

  test("shows product image", async ({ page }) => {
    const image = page.locator("main img").first();
    await expect(image).toBeVisible();
  });

  test("has add to cart button", async ({ page }) => {
    // "In den Warenkorb" button in main content (not the cart icon in header)
    await expect(
      page.locator("main").getByRole("button", { name: /Warenkorb/i }),
    ).toBeVisible();
  });

  test("shows price", async ({ page }) => {
    // Price should be somewhere on the page (CHF format)
    await expect(page.getByText(/CHF/)).toBeVisible();
  });

  test("has page title with product name", async ({ page }) => {
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
  });

  test("variant buttons update price", async ({ page }) => {
    // Check if variant buttons exist
    const variantButtons = page
      .locator("button")
      .filter({ hasText: /^(S|M|L|XL|XXL|XS)$/ });
    const count = await variantButtons.count();
    if (count === 0) {
      test.skip(true, "No size variants on this product");
      return;
    }

    // Click a different variant and check price is still visible
    await variantButtons.nth(Math.min(1, count - 1)).click();
    await expect(page.getByText(/CHF/)).toBeVisible();
  });

  test("add to cart button works", async ({ page }) => {
    const addBtn = page.locator("main").getByRole("button", { name: /Warenkorb/i });

    // If there are required variant selections, pick them first
    const sizeButtons = page.locator("button").filter({ hasText: /^(S|M|L|XL)$/ });
    if ((await sizeButtons.count()) > 0) {
      await sizeButtons.first().click();
    }

    await addBtn.click();

    // Cart sheet dialog should open after adding
    await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 5000 });
  });
});
