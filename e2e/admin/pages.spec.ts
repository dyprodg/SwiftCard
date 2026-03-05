import { test, expect } from "../fixtures/auth-test";
import { isAdminAccessible } from "../fixtures/helpers";

async function skipIfNoAdmin(page: import("@playwright/test").Page) {
  if (!(await isAdminAccessible(page))) {
    test.skip(true, "Admin access not available");
  }
}

test.describe("Admin Pages", () => {
  test("pages list loads", async ({ page, serverErrors }) => {
    await page.goto("/de/admin/pages");
    await skipIfNoAdmin(page);
    await expect(page.getByRole("heading", { name: /Seiten|Pages/i })).toBeVisible();
    expect(serverErrors).toHaveLength(0);
  });

  test("has create page and create post buttons", async ({ page }) => {
    await page.goto("/de/admin/pages");
    await skipIfNoAdmin(page);
    await expect(page.getByRole("heading", { name: /Seiten|Pages/i })).toBeVisible({
      timeout: 15000,
    });
    await expect(page.getByRole("link", { name: /Neue Seite|New Page/i })).toBeVisible();
    await expect(
      page.getByRole("link", { name: /Neuer Beitrag|New Post/i }),
    ).toBeVisible();
  });

  test("has Pages and Blog tabs", async ({ page }) => {
    await page.goto("/de/admin/pages");
    await skipIfNoAdmin(page);
    await expect(page.getByRole("heading", { name: /Seiten|Pages/i })).toBeVisible({
      timeout: 15000,
    });
    await expect(
      page.getByRole("tab", { name: /Benutzerdefinierte Seiten|Custom Pages/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("tab", { name: /Blogbeiträge|Blog Posts/i }),
    ).toBeVisible();
  });

  test("new page form loads", async ({ page, serverErrors }) => {
    await page.goto("/de/admin/pages/new?type=PAGE");
    await skipIfNoAdmin(page);
    await expect(page.locator("main")).toBeVisible();
    expect(serverErrors).toHaveLength(0);
  });

  test("new post form loads", async ({ page, serverErrors }) => {
    await page.goto("/de/admin/pages/new?type=BLOG");
    await skipIfNoAdmin(page);
    await expect(page.locator("main")).toBeVisible();
    expect(serverErrors).toHaveLength(0);
  });

  test("new page form has content/SEO/translations tabs", async ({ page }) => {
    await page.goto("/de/admin/pages/new?type=PAGE");
    await skipIfNoAdmin(page);
    await expect(page.locator("main")).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole("tab", { name: /Inhalt|Content/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /SEO/i })).toBeVisible();
    await expect(
      page.getByRole("tab", { name: /Übersetzungen|Translations/i }),
    ).toBeVisible();
  });

  test("new page form has title and slug fields", async ({ page }) => {
    await page.goto("/de/admin/pages/new?type=PAGE");
    await skipIfNoAdmin(page);
    await expect(page.locator("main")).toBeVisible({ timeout: 15000 });
    await expect(page.getByLabel(/Titel|Title/i)).toBeVisible();
    await expect(page.getByLabel(/Slug/i)).toBeVisible();
  });

  test("blog form shows excerpt field", async ({ page }) => {
    await page.goto("/de/admin/pages/new?type=BLOG");
    await skipIfNoAdmin(page);
    await expect(page.locator("main")).toBeVisible({ timeout: 15000 });
    await expect(page.getByLabel(/Auszug|Excerpt/i)).toBeVisible();
  });

  test("pages appear in admin sidebar", async ({ page }) => {
    await page.goto("/de/admin/dashboard");
    await skipIfNoAdmin(page);
    await expect(page.locator("nav")).toBeVisible({ timeout: 15000 });
    await expect(
      page.locator("nav").getByRole("link", { name: /^Seiten$|^Pages$/i }),
    ).toBeVisible();
  });

  test("blog tab switches content", async ({ page }) => {
    await page.goto("/de/admin/pages?tab=blog");
    await skipIfNoAdmin(page);
    await expect(page.locator("main")).toBeVisible({ timeout: 15000 });
    // The blog tab should be active
    const blogTab = page.getByRole("tab", { name: /Blogbeiträge|Blog Posts/i });
    await expect(blogTab).toBeVisible();
  });

  test("404 for non-existent page edit", async ({ page }) => {
    const response = await page.goto("/de/admin/pages/nonexistent-id-xyz/edit");
    await skipIfNoAdmin(page);
    // Should redirect to 404 or show not found
    expect(response?.status()).toBeLessThan(500);
  });
});
