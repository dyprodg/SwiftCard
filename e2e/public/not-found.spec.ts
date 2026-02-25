import { test, expect } from "../fixtures/base-test";

test.describe("404 Not Found", () => {
  test("shows 404 for invalid route (DE)", async ({ page }) => {
    const response = await page.goto("/de/this-page-does-not-exist");
    expect(response?.status()).toBe(404);
  });

  test("shows 404 for invalid route (EN)", async ({ page }) => {
    const response = await page.goto("/en/this-page-does-not-exist");
    expect(response?.status()).toBe(404);
  });

  test("404 page has heading", async ({ page }) => {
    await page.goto("/de/this-page-does-not-exist");
    const heading = page.locator("h2");
    await expect(heading).toBeVisible();
  });

  test("404 page renders content", async ({ page }) => {
    await page.goto("/de/this-page-does-not-exist");
    // 404 page should render the "404" heading
    await expect(page.getByRole("heading", { name: "404" })).toBeVisible();
  });
});
