/* eslint-disable react-hooks/rules-of-hooks */
import { test as base, expect, type Page } from "@playwright/test";

// Known benign console messages to ignore
const IGNORED_CONSOLE_PATTERNS = [
  /favicon/i,
  /hydration/i,
  /download the React DevTools/i,
  /Third-party cookie/i,
  /Clerk:/i,
  /\[Fast Refresh\]/,
  /webpack/i,
  /turbopack/i,
  /ResizeObserver loop/i,
];

type BaseFixtures = {
  consoleErrors: string[];
  serverErrors: { url: string; status: number }[];
  dismissCookies: () => Promise<void>;
  noErrors: () => void;
};

export const test = base.extend<BaseFixtures>({
  consoleErrors: async ({ page }, use) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        const text = msg.text();
        const isIgnored = IGNORED_CONSOLE_PATTERNS.some((p) => p.test(text));
        if (!isIgnored) {
          errors.push(text);
        }
      }
    });
    await use(errors);
  },

  serverErrors: async ({ page }, use) => {
    const errors: { url: string; status: number }[] = [];
    page.on("response", (response) => {
      if (response.status() >= 500) {
        errors.push({ url: response.url(), status: response.status() });
      }
    });
    await use(errors);
  },

  dismissCookies: async ({ page }, use) => {
    const fn = async () => {
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
    };
    await use(fn);
  },

  noErrors: async ({ consoleErrors, serverErrors }, use) => {
    const fn = () => {
      if (serverErrors.length > 0) {
        throw new Error(
          `Server errors detected:\n${serverErrors.map((e) => `  ${e.status} ${e.url}`).join("\n")}`,
        );
      }
      if (consoleErrors.length > 0) {
        throw new Error(
          `Console errors detected:\n${consoleErrors.map((e) => `  ${e}`).join("\n")}`,
        );
      }
    };
    await use(fn);
  },
});

export { expect };

/**
 * Helper: wait for page to be fully loaded (no network activity)
 */
export async function waitForPageReady(page: Page) {
  await page.waitForLoadState("networkidle");
}

/**
 * Helper: check if a page returns a successful status (not 4xx/5xx)
 */
export async function expectPageLoads(page: Page, url: string) {
  const response = await page.goto(url);
  expect(response?.status()).toBeLessThan(400);
}
