import type { Page } from "@playwright/test";

/** Dismiss the cookie consent banner by pre-setting localStorage */
export async function dismissCookieBanner(page: Page) {
  await page.evaluate(() => {
    localStorage.setItem(
      "swiftcard-cookie-consent",
      JSON.stringify({
        state: { consent: { essential: true, analytics: false } },
        version: 0,
      }),
    );
  });
  await page.reload();
}

/** Clear the cart by resetting zustand localStorage state */
export async function clearCart(page: Page) {
  await page.evaluate(() => {
    localStorage.removeItem("swiftcard-cart");
  });
  await page.reload();
}

/** Check if a feature is enabled by looking at the navigation */
export async function isFeatureEnabled(page: Page, feature: "bundles" | "gift-cards") {
  await page.goto("/de");
  const link = page.locator(`header a[href*="/${feature}"]`);
  return (await link.count()) > 0;
}

/**
 * Check if the page was redirected to sign-in by Clerk (client-side redirect).
 * Returns true if on sign-in page after a brief wait.
 */
export async function isOnSignInPage(page: Page): Promise<boolean> {
  await page.waitForTimeout(2000);
  return page.url().includes("sign-in");
}

/**
 * Check if an admin page loaded successfully (not 404 or sign-in redirect).
 * Admin pages return 404 when the user lacks the admin role.
 */
export async function isAdminAccessible(page: Page): Promise<boolean> {
  const pageNotFound = await page
    .getByText("Page Not Found")
    .isVisible()
    .catch(() => false);
  if (pageNotFound) return false;
  if (page.url().includes("sign-in")) return false;
  return true;
}

/** Navigate to a page with cookie banner already dismissed */
export async function gotoWithCookies(page: Page, url: string) {
  await page.goto(url);
  await page.evaluate(() => {
    localStorage.setItem(
      "swiftcard-cookie-consent",
      JSON.stringify({
        state: { consent: { essential: true, analytics: false } },
        version: 0,
      }),
    );
  });
  await page.reload();
}
