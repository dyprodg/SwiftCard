/* eslint-disable react-hooks/rules-of-hooks */
import { setupClerkTestingToken } from "@clerk/testing/playwright";
import { test as baseTest, expect } from "./base-test";

/**
 * Extended test fixture that injects Clerk testing token into each page context.
 * Use this for customer and admin tests that require authentication.
 */
export const test = baseTest.extend({
  page: async ({ page }, use) => {
    await setupClerkTestingToken({ page });
    await use(page);
  },
});

export { expect };
