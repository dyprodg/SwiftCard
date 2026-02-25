import { test as setup, expect } from "@playwright/test";
import { setupClerkTestingToken } from "@clerk/testing/playwright";

const CUSTOMER_AUTH_FILE = "e2e/.auth/customer.json";
const ADMIN_AUTH_FILE = "e2e/.auth/admin.json";

setup("authenticate as customer", async ({ page }) => {
  const email = process.env.E2E_CLERK_USER_EMAIL;
  const password = process.env.E2E_CLERK_USER_PASSWORD;

  if (!email || !password) {
    console.warn(
      "⚠ E2E_CLERK_USER_EMAIL / E2E_CLERK_USER_PASSWORD not set — skipping customer auth setup",
    );
    // Save empty state so dependent tests can still run (they'll be unauthenticated)
    await page.context().storageState({ path: CUSTOMER_AUTH_FILE });
    return;
  }

  await setupClerkTestingToken({ page });
  await page.goto("/de/sign-in");

  // Clerk sign-in form
  await page.getByLabel(/email/i).fill(email);
  await page.getByRole("button", { name: /continue/i }).click();
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole("button", { name: /continue/i }).click();

  // Wait for redirect after sign-in
  await page.waitForURL(/\/de/, { timeout: 15_000 });
  await expect(page.locator("header")).toBeVisible();

  await page.context().storageState({ path: CUSTOMER_AUTH_FILE });
});

setup("authenticate as admin", async ({ page }) => {
  const email = process.env.E2E_CLERK_ADMIN_EMAIL;
  const password = process.env.E2E_CLERK_ADMIN_PASSWORD;

  if (!email || !password) {
    console.warn(
      "⚠ E2E_CLERK_ADMIN_EMAIL / E2E_CLERK_ADMIN_PASSWORD not set — skipping admin auth setup",
    );
    await page.context().storageState({ path: ADMIN_AUTH_FILE });
    return;
  }

  await setupClerkTestingToken({ page });
  await page.goto("/de/sign-in");

  await page.getByLabel(/email/i).fill(email);
  await page.getByRole("button", { name: /continue/i }).click();
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole("button", { name: /continue/i }).click();

  // Admin should be redirected or we navigate to admin
  await page.waitForURL(/\/de/, { timeout: 15_000 });
  await page.goto("/de/admin/dashboard");
  await expect(page.locator("h1")).toBeVisible({ timeout: 10_000 });

  await page.context().storageState({ path: ADMIN_AUTH_FILE });
});
