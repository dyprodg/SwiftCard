import { test as setup } from "@playwright/test";
import { setupClerkTestingToken } from "@clerk/testing/playwright";

const CUSTOMER_AUTH_FILE = "e2e/.auth/customer.json";
const ADMIN_AUTH_FILE = "e2e/.auth/admin.json";
const CLERK_API = "https://api.clerk.com/v1";

type ClerkWindow = Window & {
  Clerk?: {
    client?: {
      signIn: {
        create: (opts: {
          strategy: string;
          ticket: string;
        }) => Promise<{ createdSessionId: string }>;
      };
    };
    setActive: (opts: { session: string }) => Promise<void>;
  };
};

/**
 * Create a Clerk sign-in token for a user by email.
 * Uses the Backend API to bypass the sign-in UI (social login, 2FA, etc.).
 */
async function createSignInToken(email: string): Promise<string | null> {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) {
    console.warn("⚠ CLERK_SECRET_KEY not set — cannot create sign-in token");
    return null;
  }

  // Find user by email
  const usersRes = await fetch(
    `${CLERK_API}/users?email_address[]=${encodeURIComponent(email)}`,
    { headers: { Authorization: `Bearer ${secretKey}` } },
  );
  const users = await usersRes.json();
  if (!users?.length) {
    console.warn(`⚠ No Clerk user found for ${email}`);
    return null;
  }

  // Create sign-in token
  const tokenRes = await fetch(`${CLERK_API}/sign_in_tokens`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ user_id: users[0].id }),
  });
  const tokenData = await tokenRes.json();
  if (!tokenData?.token) {
    console.warn("⚠ Failed to create sign-in token:", tokenData);
    return null;
  }

  return tokenData.token;
}

setup("authenticate as customer", async ({ page }) => {
  setup.setTimeout(60_000);

  const email = process.env.E2E_CLERK_USER_EMAIL;
  if (!email) {
    console.warn("⚠ E2E_CLERK_USER_EMAIL not set — skipping customer auth");
    await page.context().storageState({ path: CUSTOMER_AUTH_FILE });
    return;
  }

  const token = await createSignInToken(email);
  if (!token) {
    console.warn("⚠ Could not create sign-in token — skipping customer auth");
    await page.context().storageState({ path: CUSTOMER_AUTH_FILE });
    return;
  }

  await setupClerkTestingToken({ page });
  await page.goto("/de");

  // Use Clerk's client-side API to sign in with the token
  await page.evaluate(async (ticket: string) => {
    // Wait for Clerk to initialize
    const win = window as ClerkWindow;
    let attempts = 0;
    while (!win.Clerk?.client && attempts < 50) {
      await new Promise((r) => setTimeout(r, 200));
      attempts++;
    }
    const clerk = win.Clerk;
    if (!clerk?.client) throw new Error("Clerk client not available");

    const signIn = await clerk.client.signIn.create({
      strategy: "ticket",
      ticket,
    });
    await clerk.setActive({ session: signIn.createdSessionId });
  }, token);

  // Verify auth by navigating to account page
  await page.goto("/de/account");
  await page.waitForTimeout(2000);
  if (page.url().includes("sign-in")) {
    console.warn("⚠ Customer sign-in via token failed — tests will skip");
  } else {
    console.log("✓ Customer authenticated successfully");
  }

  await page.context().storageState({ path: CUSTOMER_AUTH_FILE });
});

setup("authenticate as admin", async ({ page }) => {
  setup.setTimeout(60_000);

  const email = process.env.E2E_CLERK_ADMIN_EMAIL;
  if (!email) {
    console.warn("⚠ E2E_CLERK_ADMIN_EMAIL not set — skipping admin auth");
    await page.context().storageState({ path: ADMIN_AUTH_FILE });
    return;
  }

  const token = await createSignInToken(email);
  if (!token) {
    console.warn("⚠ Could not create sign-in token — skipping admin auth");
    await page.context().storageState({ path: ADMIN_AUTH_FILE });
    return;
  }

  await setupClerkTestingToken({ page });
  await page.goto("/de");

  // Use Clerk's client-side API to sign in with the token
  await page.evaluate(async (ticket: string) => {
    const win = window as ClerkWindow;
    let attempts = 0;
    while (!win.Clerk?.client && attempts < 50) {
      await new Promise((r) => setTimeout(r, 200));
      attempts++;
    }
    const clerk = win.Clerk;
    if (!clerk?.client) throw new Error("Clerk client not available");

    const signIn = await clerk.client.signIn.create({
      strategy: "ticket",
      ticket,
    });
    await clerk.setActive({ session: signIn.createdSessionId });
  }, token);

  // Wait for session cookies to propagate, then reload
  await page.waitForTimeout(1000);
  await page.reload();
  await page.waitForTimeout(1000);

  // Verify admin access (admin requires publicMetadata.role === "admin")
  await page.goto("/de/admin/dashboard");
  const h1 = page.locator("h1");
  const isAdminAccessible = await h1.isVisible({ timeout: 10_000 }).catch(() => false);
  if (isAdminAccessible) {
    console.log("✓ Admin authenticated successfully");
  } else {
    console.warn(
      '⚠ Admin dashboard not accessible — ensure the admin user has { "role": "admin" } in Clerk publicMetadata. ' +
        "Admin tests will be skipped.",
    );
  }

  await page.context().storageState({ path: ADMIN_AUTH_FILE });
});
