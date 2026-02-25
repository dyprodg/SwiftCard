import { test, expect } from "../fixtures/base-test";

test.describe("Bundles (Storefront)", () => {
  test("bundles page loads or returns 404 (feature flag)", async ({ page }) => {
    const response = await page.goto("/de/bundles");
    const status = response?.status();
    expect([200, 404]).toContain(status);
  });

  test("bundles page has heading when enabled", async ({ page }) => {
    const response = await page.goto("/de/bundles");
    if (response?.status() === 404) {
      test.skip(true, "Bundles feature is disabled");
      return;
    }
    // Page loaded successfully - check for any heading
    await expect(page.locator("h1, h2").first()).toBeVisible();
  });

  test("bundle cards link to detail pages", async ({ page }) => {
    const response = await page.goto("/de/bundles");
    if (response?.status() === 404) {
      test.skip(true, "Bundles feature is disabled");
      return;
    }

    const bundleLinks = page.locator('a[href*="/de/bundles/"]');
    const count = await bundleLinks.count();
    if (count === 0) {
      test.skip(true, "No bundles in database");
      return;
    }

    const href = await bundleLinks.first().getAttribute("href");
    expect(href).toMatch(/\/de\/bundles\/.+/);
  });

  test("clicking bundle navigates to detail", async ({ page }) => {
    const response = await page.goto("/de/bundles");
    if (response?.status() === 404) {
      test.skip(true, "Bundles feature is disabled");
      return;
    }

    const bundleLinks = page.locator('a[href*="/de/bundles/"]');
    if ((await bundleLinks.count()) === 0) {
      test.skip(true, "No bundles in database");
      return;
    }

    await bundleLinks.first().click();
    await expect(page).toHaveURL(/\/de\/bundles\/.+/);
    await expect(page.locator("h1")).toBeVisible();
  });

  test("no server errors", async ({ page, serverErrors }) => {
    await page.goto("/de/bundles");
    expect(serverErrors).toHaveLength(0);
  });
});
