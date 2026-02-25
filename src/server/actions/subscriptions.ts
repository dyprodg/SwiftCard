"use server";

import { eq, and } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { updateTag } from "next/cache";

import { db } from "@/db";
import { subscriptionPlans, subscriptions } from "@/db/schema/subscriptions";
import { products, productVariants } from "@/db/schema/products";
import { getStripeServer } from "@/lib/stripe/client";
import {
  createSubscriptionPlanSchema,
  updateSubscriptionPlanSchema,
} from "@/lib/validations/subscription";
import {
  calculateSubscriptionPrice,
  toStripeInterval,
} from "@/lib/utils/subscription-price";

async function requireAdmin() {
  const { userId, sessionClaims } = await auth();
  if (!userId) throw new Error("Unauthorized");
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (role !== "admin") throw new Error("Unauthorized");
  return userId;
}

// ─── Admin Actions ───

export async function createSubscriptionPlan(input: unknown) {
  await requireAdmin();
  const data = createSubscriptionPlanSchema.parse(input);
  const stripe = getStripeServer();

  // Fetch product (and variant if specified)
  const product = await db.query.products.findFirst({
    where: eq(products.id, data.productId),
  });
  if (!product) throw new Error("Product not found");

  let variant = null;
  if (data.variantId) {
    variant = await db.query.productVariants.findFirst({
      where: eq(productVariants.id, data.variantId),
    });
    if (!variant) throw new Error("Variant not found");
  }

  const unitAmount = calculateSubscriptionPrice(
    product.basePrice,
    variant?.priceAdjustment ?? 0,
    data.discountPercent,
  );

  // Create Stripe Product + Price
  const stripeProduct = await stripe.products.create({
    name: `${product.name} — ${data.name}`,
    metadata: { swiftcard_product_id: product.id },
  });

  const recurring = toStripeInterval(data.interval);
  const stripePrice = await stripe.prices.create({
    product: stripeProduct.id,
    unit_amount: unitAmount,
    currency: "chf",
    recurring: {
      interval: recurring.interval,
      interval_count: recurring.interval_count,
    },
  });

  // Insert plan
  const [plan] = await db
    .insert(subscriptionPlans)
    .values({
      productId: data.productId,
      variantId: data.variantId ?? null,
      name: data.name,
      interval: data.interval,
      discountPercent: data.discountPercent,
      stripePriceId: stripePrice.id,
    })
    .returning();

  // Mark product as subscribable
  await db
    .update(products)
    .set({ subscribable: true })
    .where(eq(products.id, data.productId));

  updateTag("subscription-plans");
  updateTag("products");
  return plan;
}

export async function updateSubscriptionPlan(input: unknown) {
  await requireAdmin();
  const data = updateSubscriptionPlanSchema.parse(input);

  const existing = await db.query.subscriptionPlans.findFirst({
    where: eq(subscriptionPlans.id, data.id),
  });
  if (!existing) throw new Error("Plan not found");

  const updateData: Record<string, unknown> = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.active !== undefined) updateData.active = data.active;

  // If discount changes, create a new Stripe Price
  if (
    data.discountPercent !== undefined &&
    data.discountPercent !== existing.discountPercent
  ) {
    const stripe = getStripeServer();
    const product = await db.query.products.findFirst({
      where: eq(products.id, existing.productId),
    });
    if (!product) throw new Error("Product not found");

    let variant = null;
    if (existing.variantId) {
      variant = await db.query.productVariants.findFirst({
        where: eq(productVariants.id, existing.variantId),
      });
    }

    const unitAmount = calculateSubscriptionPrice(
      product.basePrice,
      variant?.priceAdjustment ?? 0,
      data.discountPercent,
    );

    // Get the Stripe product from the old price
    const oldPrice = await stripe.prices.retrieve(existing.stripePriceId);

    const recurring = toStripeInterval(existing.interval);
    const newPrice = await stripe.prices.create({
      product:
        typeof oldPrice.product === "string" ? oldPrice.product : oldPrice.product.id,
      unit_amount: unitAmount,
      currency: "chf",
      recurring: {
        interval: recurring.interval,
        interval_count: recurring.interval_count,
      },
    });

    // Deactivate old price
    await stripe.prices.update(existing.stripePriceId, { active: false });

    updateData.stripePriceId = newPrice.id;
    updateData.discountPercent = data.discountPercent;
  }

  if (Object.keys(updateData).length === 0) return existing;

  const [updated] = await db
    .update(subscriptionPlans)
    .set(updateData)
    .where(eq(subscriptionPlans.id, data.id))
    .returning();

  // If deactivated, check if product still has active plans
  if (data.active === false) {
    const remaining = await db.query.subscriptionPlans.findFirst({
      where: and(
        eq(subscriptionPlans.productId, existing.productId),
        eq(subscriptionPlans.active, true),
      ),
    });
    if (!remaining) {
      await db
        .update(products)
        .set({ subscribable: false })
        .where(eq(products.id, existing.productId));
    }
  }

  updateTag("subscription-plans");
  return updated;
}

export async function deleteSubscriptionPlan(id: string) {
  await requireAdmin();

  const plan = await db.query.subscriptionPlans.findFirst({
    where: eq(subscriptionPlans.id, id),
  });
  if (!plan) throw new Error("Plan not found");

  // Check for active subscriptions
  const activeSub = await db.query.subscriptions.findFirst({
    where: and(eq(subscriptions.planId, id), eq(subscriptions.status, "ACTIVE")),
  });
  if (activeSub) {
    throw new Error(
      "Cannot delete plan with active subscriptions. Deactivate it instead.",
    );
  }

  // Deactivate Stripe price
  const stripe = getStripeServer();
  await stripe.prices.update(plan.stripePriceId, { active: false }).catch(() => {});

  await db.delete(subscriptionPlans).where(eq(subscriptionPlans.id, id));

  // Check if product still has active plans
  const remaining = await db.query.subscriptionPlans.findFirst({
    where: and(
      eq(subscriptionPlans.productId, plan.productId),
      eq(subscriptionPlans.active, true),
    ),
  });
  if (!remaining) {
    await db
      .update(products)
      .set({ subscribable: false })
      .where(eq(products.id, plan.productId));
  }

  updateTag("subscription-plans");
  updateTag("products");
}

// ─── Customer Actions ───

export async function createSubscriptionCheckout(planId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Not authenticated");

  const user = await auth().then((a) => a);
  const email = (user.sessionClaims as Record<string, unknown>)?.email as
    | string
    | undefined;

  const plan = await db.query.subscriptionPlans.findFirst({
    where: and(eq(subscriptionPlans.id, planId), eq(subscriptionPlans.active, true)),
  });
  if (!plan) throw new Error("Plan not found or inactive");

  const stripe = getStripeServer();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  // Find or create Stripe customer by email
  let stripeCustomerId: string | undefined;
  if (email) {
    const existing = await stripe.customers.list({ email, limit: 1 });
    if (existing.data.length > 0) {
      stripeCustomerId = existing.data[0].id;
    }
  }

  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: email || undefined,
      metadata: { clerk_user_id: userId },
    });
    stripeCustomerId = customer.id;
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: stripeCustomerId,
    line_items: [{ price: plan.stripePriceId, quantity: 1 }],
    metadata: {
      planId: plan.id,
      userId,
      email: email || "",
      isSubscription: "true",
    },
    success_url: `${appUrl}/en/account/subscriptions?success=true`,
    cancel_url: `${appUrl}/en/products`,
  });

  return { url: session.url };
}

export async function cancelSubscription(subscriptionId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Not authenticated");

  const sub = await db.query.subscriptions.findFirst({
    where: and(
      eq(subscriptions.id, subscriptionId),
      eq(subscriptions.customerId, userId),
    ),
  });
  if (!sub) throw new Error("Subscription not found");
  if (sub.status !== "ACTIVE" && sub.status !== "PAST_DUE") {
    throw new Error("Subscription cannot be cancelled");
  }

  const stripe = getStripeServer();
  await stripe.subscriptions.update(sub.stripeSubscriptionId, {
    cancel_at_period_end: true,
  });

  await db
    .update(subscriptions)
    .set({
      status: "CANCELLED",
      cancelledAt: new Date(),
    })
    .where(eq(subscriptions.id, subscriptionId));

  updateTag("subscriptions");
}

export async function pauseSubscription(subscriptionId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Not authenticated");

  const sub = await db.query.subscriptions.findFirst({
    where: and(
      eq(subscriptions.id, subscriptionId),
      eq(subscriptions.customerId, userId),
    ),
  });
  if (!sub) throw new Error("Subscription not found");
  if (sub.status !== "ACTIVE") throw new Error("Only active subscriptions can be paused");

  const stripe = getStripeServer();
  await stripe.subscriptions.update(sub.stripeSubscriptionId, {
    pause_collection: { behavior: "void" },
  });

  await db
    .update(subscriptions)
    .set({
      status: "PAUSED",
      pausedAt: new Date(),
    })
    .where(eq(subscriptions.id, subscriptionId));

  updateTag("subscriptions");
}

export async function resumeSubscription(subscriptionId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Not authenticated");

  const sub = await db.query.subscriptions.findFirst({
    where: and(
      eq(subscriptions.id, subscriptionId),
      eq(subscriptions.customerId, userId),
    ),
  });
  if (!sub) throw new Error("Subscription not found");
  if (sub.status !== "PAUSED")
    throw new Error("Only paused subscriptions can be resumed");

  const stripe = getStripeServer();
  await stripe.subscriptions.update(sub.stripeSubscriptionId, {
    pause_collection: "",
  } as Record<string, unknown>);

  await db
    .update(subscriptions)
    .set({
      status: "ACTIVE",
      pausedAt: null,
    })
    .where(eq(subscriptions.id, subscriptionId));

  updateTag("subscriptions");
}
