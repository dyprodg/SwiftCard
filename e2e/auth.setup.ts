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
    user?: {
      publicMetadata: Record<string, unknown>;
      primaryEmailAddress?: { emailAddress: string };
    };
    session?: { id: string };
  };
};

/**
 * Create a Clerk sign-in token for a user by email.
 * Uses the Backend API to bypass the sign-in UI (social login, 2FA, etc.).
 */
async function createSignInToken(email: string): Promise<string | null> {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) {
    console.warn("CLERK_SECRET_KEY not set");
    return null;
  }

  const usersRes = await fetch(
    `${CLERK_API}/users?email_address[]=${encodeURIComponent(email)}`,
    { headers: { Authorization: `Bearer ${secretKey}` } },
  );
  const users = (await usersRes.json()) as Array<{
    id: string;
    email_addresses: Array<{ email_address: string }>;
  }>;

  // Find the exact user matching the email (API may return multiple)
  const user = users?.find((u) =>
    u.email_addresses.some((e) => e.email_address.toLowerCase() === email.toLowerCase()),
  );
  if (!user) {
    console.warn(`No Clerk user found for ${email}`);
    return null;
  }

  const tokenRes = await fetch(`${CLERK_API}/sign_in_tokens`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ user_id: user.id }),
  });
  const tokenData = await tokenRes.json();
  return tokenData?.token || null;
}

async function signInViaToken(page: import("@playwright/test").Page, token: string) {
  await setupClerkTestingToken({ page });
  await page.goto("/de");

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

  await page.waitForTimeout(1000);
}

// Single account used for both customer and admin tests
setup("authenticate", async ({ page }) => {
  setup.setTimeout(60_000);

  const email = process.env.E2E_CLERK_ADMIN_EMAIL;
  if (!email) {
    console.warn("E2E_CLERK_ADMIN_EMAIL not set — skipping auth");
    await page.context().storageState({ path: CUSTOMER_AUTH_FILE });
    await page.context().storageState({ path: ADMIN_AUTH_FILE });
    return;
  }

  const token = await createSignInToken(email);
  if (!token) {
    console.warn("Could not create sign-in token — skipping auth");
    await page.context().storageState({ path: CUSTOMER_AUTH_FILE });
    await page.context().storageState({ path: ADMIN_AUTH_FILE });
    return;
  }

  await signInViaToken(page, token);

  // Verify sign-in worked
  await page.goto("/de/account");
  await page.waitForTimeout(2000);
  if (page.url().includes("sign-in")) {
    console.warn("Sign-in failed — tests will skip auth-required checks");
  } else {
    console.log("Authenticated successfully");
  }

  // Save the same session for both customer and admin projects
  await page.context().storageState({ path: CUSTOMER_AUTH_FILE });
  await page.context().storageState({ path: ADMIN_AUTH_FILE });
});
