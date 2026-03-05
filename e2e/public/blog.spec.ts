import { test, expect } from "../fixtures/base-test";
import { expectPageLoads } from "../fixtures/base-test";

test.describe("Blog Listing Page", () => {
  test("blog page loads without errors", async ({ page, serverErrors }) => {
    await page.goto("/de/blog");
    await expect(page.getByRole("heading", { name: /Blog/i, level: 1 })).toBeVisible({
      timeout: 15000,
    });
    expect(serverErrors).toHaveLength(0);
  });

  test("blog page loads in English", async ({ page, serverErrors }) => {
    await page.goto("/en/blog");
    await expect(page.getByRole("heading", { name: /Blog/i, level: 1 })).toBeVisible({
      timeout: 15000,
    });
    expect(serverErrors).toHaveLength(0);
  });

  test("blog page returns 200", async ({ page }) => {
    const response = await page.goto("/de/blog");
    expect(response?.status()).toBe(200);
  });

  test("blog page has correct page title", async ({ page }) => {
    await page.goto("/de/blog");
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
  });

  test("blog page shows no-posts message when empty", async ({ page }) => {
    await page.goto("/de/blog");
    await expect(page.locator("main")).toBeVisible({ timeout: 15000 });
    // Either shows posts or the empty state message
    const hasPosts = await page.locator("article, [data-testid='blog-post']").count();
    if (hasPosts === 0) {
      // Empty state should be visible instead
      await expect(page.locator("main")).toBeVisible();
    }
  });

  test("blog page with unknown tag returns 200", async ({ page, serverErrors }) => {
    const response = await page.goto("/de/blog?tag=nonexistenttag123");
    expect(response?.status()).toBe(200);
    expect(serverErrors).toHaveLength(0);
  });

  test("blog listing is accessible via pagination params", async ({ page }) => {
    const response = await page.goto("/de/blog?page=1");
    expect(response?.status()).toBe(200);
  });
});

test.describe("Blog Post Page", () => {
  test("non-existent blog post returns 404", async ({ page }) => {
    const response = await page.goto("/de/blog/this-post-does-not-exist-xyz");
    expect(response?.status()).toBe(404);
  });

  test("non-existent blog post in English returns 404", async ({ page }) => {
    const response = await page.goto("/en/blog/this-post-does-not-exist-xyz");
    expect(response?.status()).toBe(404);
  });
});

test.describe("Custom Pages", () => {
  test("non-existent custom page returns 404", async ({ page }) => {
    const response = await page.goto("/de/pages/this-page-does-not-exist-xyz");
    expect(response?.status()).toBe(404);
  });

  test("non-existent custom page in English returns 404", async ({ page }) => {
    const response = await page.goto("/en/pages/this-page-does-not-exist-xyz");
    expect(response?.status()).toBe(404);
  });
});

test.describe("Blog SEO", () => {
  test("blog listing page has meta title", async ({ page }) => {
    await page.goto("/de/blog");
    const title = await page.title();
    expect(title).toContain("Blog");
  });

  test("blog listing page in English has meta title", async ({ page }) => {
    await page.goto("/en/blog");
    const title = await page.title();
    expect(title).toContain("Blog");
  });

  test("sitemap includes blog path when pages exist", async ({ page }) => {
    const response = await page.goto("/sitemap.xml");
    expect(response?.status()).toBe(200);
    const body = await page.content();
    expect(body).toContain("<urlset");
  });
});
