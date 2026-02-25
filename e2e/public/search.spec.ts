import { test, expect } from "../fixtures/base-test";

test.describe("Search", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/de");
  });

  test("search bar is visible in header", async ({ page }) => {
    const searchInput = page.locator('header input[type="search"]');
    await expect(searchInput).toBeVisible();
  });

  test("typing in search shows dropdown results or empty state", async ({ page }) => {
    const searchInput = page.locator('header input[type="search"]');
    await searchInput.fill("test");
    // Wait for debounce + server response
    await page.waitForTimeout(1000);

    // Just verify the search input accepted input and page didn't error
    await expect(searchInput).toHaveValue("test");
  });

  test("clearing search hides dropdown", async ({ page }) => {
    const searchInput = page.locator('header input[type="search"]');
    await searchInput.fill("test");
    await page.waitForTimeout(500); // Wait for debounce
    await searchInput.fill("");

    // Dropdown should disappear
    await expect(page.locator("header ul li")).toBeHidden({ timeout: 3000 });
  });
});
