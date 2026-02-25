import { test, expect } from "../fixtures/base-test";

test.describe("Legal Pages (DE)", () => {
  test("terms page loads with heading", async ({ page, serverErrors }) => {
    await page.goto("/de/terms");
    await expect(
      page.getByRole("heading", { name: /Allgemeine Geschäftsbedingungen/i }),
    ).toBeVisible();
    expect(serverErrors).toHaveLength(0);
  });

  test("privacy page loads with heading", async ({ page, serverErrors }) => {
    await page.goto("/de/privacy");
    await expect(
      page.getByRole("heading", { name: /Datenschutzerklärung/i }),
    ).toBeVisible();
    expect(serverErrors).toHaveLength(0);
  });

  test("imprint page loads with heading", async ({ page, serverErrors }) => {
    await page.goto("/de/imprint");
    await expect(page.getByRole("heading", { name: /Impressum/i })).toBeVisible();
    expect(serverErrors).toHaveLength(0);
  });

  test("terms page has proper title", async ({ page }) => {
    await page.goto("/de/terms");
    const title = await page.title();
    expect(title).toContain("Geschäftsbedingungen");
  });

  test("privacy page has proper title", async ({ page }) => {
    await page.goto("/de/privacy");
    const title = await page.title();
    expect(title).toContain("Datenschutz");
  });
});

test.describe("Legal Pages (EN)", () => {
  test("terms page loads in English", async ({ page, serverErrors }) => {
    await page.goto("/en/terms");
    await expect(page.getByRole("heading", { name: /Terms of Service/i })).toBeVisible();
    expect(serverErrors).toHaveLength(0);
  });

  test("privacy page loads in English", async ({ page, serverErrors }) => {
    await page.goto("/en/privacy");
    await expect(page.getByRole("heading", { name: /Privacy Policy/i })).toBeVisible();
    expect(serverErrors).toHaveLength(0);
  });

  test("imprint page loads in English", async ({ page, serverErrors }) => {
    await page.goto("/en/imprint");
    await expect(page.getByRole("heading", { name: /Imprint/i })).toBeVisible();
    expect(serverErrors).toHaveLength(0);
  });

  test("EN terms page has English title", async ({ page }) => {
    await page.goto("/en/terms");
    const title = await page.title();
    expect(title).toContain("Terms");
  });
});

test.describe("Legal Pages - Consistency", () => {
  test("all legal pages have header and footer", async ({ page }) => {
    for (const path of ["/de/terms", "/de/privacy", "/de/imprint"]) {
      await page.goto(path);
      await expect(page.locator("header")).toBeVisible();
      await expect(page.locator("footer")).toBeVisible();
    }
  });
});
