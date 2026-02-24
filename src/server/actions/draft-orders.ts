"use server";

import { db } from "@/db";
import { products, productVariants, shopSettings, discounts } from "@/db/schema";
import { orders, orderItems } from "@/db/schema/orders";
import { eq, sql, and, or, isNull, lte, gte, ne } from "drizzle-orm";
import { updateTag } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { getStripeServer } from "@/lib/stripe/client";
import {
  createDraftOrderSchema,
  updateDraftOrderSchema,
  sendPaymentLinkSchema,
  type CreateDraftOrderInput,
  type UpdateDraftOrderInput,
  type SendPaymentLinkInput,
} from "@/lib/validations/draft-order";
import {
  getShippingZoneForCountry,
  getTaxRateForCountry,
  getCartWeight,
} from "@/server/queries/shipping";
import { filterApplicableRates } from "@/lib/utils/shipping-calculator";
import { generateOrderNumber } from "@/lib/utils/order-number";
import { buildOrderViewUrl } from "@/lib/utils/order-url";
import {
  calculateDiscount,
  findBestAutomaticDiscount,
} from "@/lib/utils/discount-calculator";
import { createReservationsInTx } from "@/lib/reservations";
import { logOrderEvent, logOrderEventTx } from "@/lib/utils/order-events";
import { sendPaymentLinkEmail } from "@/lib/resend";

async function requireAdmin() {
  const { userId, sessionClaims } = await auth();
  if (!userId) throw new Error("Unauthorized");
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (role !== "admin") throw new Error("Unauthorized");
  return userId;
}

/**
 * Calculate totals for a draft order (discount, shipping, tax).
 * Reusable by both create and update actions.
 */
async function calculateDraftTotals(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  items: CreateDraftOrderInput["items"],
  country: string,
  couponCode?: string,
  shippingRateId?: string,
) {
  let subtotal = 0;
  for (const item of items) {
    subtotal += item.unitPrice * item.quantity;
  }

  // ===== DISCOUNT CALCULATION =====
  let discountId: string | null = null;
  let discountAmount = 0;
  let discountCode: string | null = null;
  let freeShipping = false;

  const enrichedItems = items.map((item) => ({
    productId: item.productId,
    categoryId: item.categoryId,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
  }));

  if (couponCode) {
    const now = new Date();
    const discount = await tx.query.discounts.findFirst({
      where: and(
        eq(discounts.code, couponCode.toUpperCase()),
        eq(discounts.active, true),
        eq(discounts.automatic, false),
        or(isNull(discounts.startsAt), lte(discounts.startsAt, now)),
        or(isNull(discounts.expiresAt), gte(discounts.expiresAt, now)),
      ),
      with: { products: true, categories: true },
    });

    if (discount) {
      if (!discount.maxUses || discount.usedCount < discount.maxUses) {
        const result = calculateDiscount(
          {
            ...discount,
            productIds: discount.products.map((p) => p.productId),
            categoryIds: discount.categories.map((c) => c.categoryId),
          },
          enrichedItems,
          subtotal,
        );

        if (result) {
          discountId = discount.id;
          discountAmount = result.amount;
          discountCode = discount.code;
          freeShipping = result.freeShipping;
        }
      }
    }
  } else {
    // Try automatic discounts
    const now = new Date();
    const autoDiscounts = await tx.query.discounts.findMany({
      where: and(
        eq(discounts.active, true),
        eq(discounts.automatic, true),
        or(isNull(discounts.startsAt), lte(discounts.startsAt, now)),
        or(isNull(discounts.expiresAt), gte(discounts.expiresAt, now)),
      ),
      with: { products: true, categories: true },
    });

    if (autoDiscounts.length > 0) {
      const enrichedAutoDiscounts = autoDiscounts.map((d) => ({
        ...d,
        productIds: d.products.map((p) => p.productId),
        categoryIds: d.categories.map((c) => c.categoryId),
      }));

      const best = findBestAutomaticDiscount(
        enrichedAutoDiscounts,
        enrichedItems,
        subtotal,
      );

      if (best) {
        discountId = best.discountId;
        discountAmount = best.amount;
        discountCode = best.code;
        freeShipping = best.freeShipping;
      }
    }
  }

  // ===== SHIPPING =====
  const discountedSubtotal = subtotal - discountAmount;

  const [settings] = await tx
    .select()
    .from(shopSettings)
    .where(eq(shopSettings.id, "singleton"));

  const currency = settings?.currency ?? "CHF";

  // Zone-based tax
  const zoneTaxRate = await getTaxRateForCountry(country);
  const taxRate = zoneTaxRate ?? settings?.defaultTaxRate ?? 0.081;

  // Zone-based shipping
  let shippingCost: number;
  let shippingMethodName: string | null = null;

  if (shippingRateId) {
    const zone = await getShippingZoneForCountry(country);
    const rate = zone?.rates.find((r) => r.id === shippingRateId);
    if (!rate) {
      throw new Error("Selected shipping method is not available for this country");
    }

    const cartWeight = await getCartWeight(
      items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })),
    );
    const applicable = filterApplicableRates([rate], cartWeight, subtotal);
    if (applicable.length === 0) {
      throw new Error("Selected shipping method is no longer applicable");
    }

    shippingCost = freeShipping ? 0 : applicable[0].price;
    shippingMethodName = rate.name;
  } else {
    const baseShippingCost =
      settings?.freeShippingThreshold && subtotal >= settings.freeShippingThreshold
        ? 0
        : (settings?.defaultShippingCost ?? 0);
    shippingCost = freeShipping ? 0 : baseShippingCost;
  }

  const tax = Math.round(discountedSubtotal * taxRate);
  const total = discountedSubtotal + tax + shippingCost;

  return {
    subtotal,
    discountId,
    discountAmount,
    discountCode,
    freeShipping,
    shippingCost,
    shippingMethodName,
    tax,
    total,
    currency,
  };
}

export async function createDraftOrder(input: CreateDraftOrderInput) {
  const adminUserId = await requireAdmin();
  const data = createDraftOrderSchema.parse(input);

  return db.transaction(async (tx) => {
    // Validate all products/variants exist and are ACTIVE, get current prices
    const validatedItems: CreateDraftOrderInput["items"] = [];
    for (const item of data.items) {
      const [product] = await tx
        .select()
        .from(products)
        .where(eq(products.id, item.productId));

      if (!product || product.status !== "ACTIVE") {
        throw new Error(`Product "${item.productName}" is no longer available`);
      }

      let unitPrice = product.basePrice;
      if (item.variantId) {
        const [variant] = await tx
          .select()
          .from(productVariants)
          .where(eq(productVariants.id, item.variantId));
        if (!variant) {
          throw new Error(`Variant not found for "${item.productName}"`);
        }
        unitPrice = product.basePrice + variant.priceAdjustment;
      }

      validatedItems.push({
        ...item,
        unitPrice,
        categoryId: product.categoryId,
      });
    }

    const totals = await calculateDraftTotals(
      tx,
      validatedItems,
      data.shippingCountry,
      data.couponCode,
      data.shippingRateId,
    );

    // Generate order number
    const [countResult] = await tx
      .select({ count: sql<number>`count(*)::int` })
      .from(orders);
    const orderNumber = generateOrderNumber((countResult?.count ?? 0) + 1);

    // Insert draft order
    const [order] = await tx
      .insert(orders)
      .values({
        orderNumber,
        status: "DRAFT",
        paymentStatus: "PENDING",
        fulfillmentStatus: "UNFULFILLED",
        subtotal: totals.subtotal,
        tax: totals.tax,
        shipping: totals.shippingCost,
        total: totals.total,
        currency: totals.currency,
        customerEmail: data.customerEmail,
        phone: data.phone || null,
        shippingName: data.shippingName,
        shippingAddress1: data.shippingAddress1,
        shippingAddress2: data.shippingAddress2 || null,
        shippingCity: data.shippingCity,
        shippingZip: data.shippingZip,
        shippingCountry: data.shippingCountry,
        shippingMethod: totals.shippingMethodName,
        internalNote: data.internalNote || null,
        discountId: totals.discountId,
        discountAmount: totals.discountAmount,
        discountCode: totals.discountCode,
        isDraft: true,
        createdByAdmin: adminUserId,
      })
      .returning();

    // Insert order items
    await tx.insert(orderItems).values(
      validatedItems.map((item) => ({
        orderId: order.id,
        productId: item.productId,
        variantId: item.variantId,
        productName: item.productName,
        variantName: item.variantName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.unitPrice * item.quantity,
      })),
    );

    // Log event
    await logOrderEventTx(tx, {
      orderId: order.id,
      type: "DRAFT_CREATED",
      data: { orderNumber, itemCount: validatedItems.length },
      createdBy: adminUserId,
    });

    // Increment discount usedCount if applicable
    if (totals.discountId) {
      await tx
        .update(discounts)
        .set({ usedCount: sql`${discounts.usedCount} + 1` })
        .where(eq(discounts.id, totals.discountId));
    }

    updateTag("orders");
    return order;
  });
}

export async function updateDraftOrder(input: UpdateDraftOrderInput) {
  const adminUserId = await requireAdmin();
  const data = updateDraftOrderSchema.parse(input);

  return db.transaction(async (tx) => {
    // Verify order exists and is still a draft
    const existingOrder = await tx.query.orders.findFirst({
      where: and(eq(orders.id, data.orderId), eq(orders.status, "DRAFT")),
      with: { items: true },
    });

    if (!existingOrder) {
      throw new Error("Draft order not found or is no longer a draft");
    }

    // Validate items and get current prices
    const validatedItems: CreateDraftOrderInput["items"] = [];
    for (const item of data.items) {
      const [product] = await tx
        .select()
        .from(products)
        .where(eq(products.id, item.productId));

      if (!product || product.status !== "ACTIVE") {
        throw new Error(`Product "${item.productName}" is no longer available`);
      }

      let unitPrice = product.basePrice;
      if (item.variantId) {
        const [variant] = await tx
          .select()
          .from(productVariants)
          .where(eq(productVariants.id, item.variantId));
        if (!variant) {
          throw new Error(`Variant not found for "${item.productName}"`);
        }
        unitPrice = product.basePrice + variant.priceAdjustment;
      }

      validatedItems.push({
        ...item,
        unitPrice,
        categoryId: product.categoryId,
      });
    }

    const totals = await calculateDraftTotals(
      tx,
      validatedItems,
      data.shippingCountry,
      data.couponCode,
      data.shippingRateId,
    );

    // Revert old discount usedCount if it changed
    if (existingOrder.discountId && existingOrder.discountId !== totals.discountId) {
      await tx
        .update(discounts)
        .set({ usedCount: sql`GREATEST(${discounts.usedCount} - 1, 0)` })
        .where(eq(discounts.id, existingOrder.discountId));
    }

    // Increment new discount usedCount if different
    if (totals.discountId && totals.discountId !== existingOrder.discountId) {
      await tx
        .update(discounts)
        .set({ usedCount: sql`${discounts.usedCount} + 1` })
        .where(eq(discounts.id, totals.discountId));
    }

    // Update order
    await tx
      .update(orders)
      .set({
        subtotal: totals.subtotal,
        tax: totals.tax,
        shipping: totals.shippingCost,
        total: totals.total,
        currency: totals.currency,
        customerEmail: data.customerEmail,
        phone: data.phone || null,
        shippingName: data.shippingName,
        shippingAddress1: data.shippingAddress1,
        shippingAddress2: data.shippingAddress2 || null,
        shippingCity: data.shippingCity,
        shippingZip: data.shippingZip,
        shippingCountry: data.shippingCountry,
        shippingMethod: totals.shippingMethodName,
        internalNote: data.internalNote || null,
        discountId: totals.discountId,
        discountAmount: totals.discountAmount,
        discountCode: totals.discountCode,
      })
      .where(eq(orders.id, data.orderId));

    // Delete old items, insert new
    await tx.delete(orderItems).where(eq(orderItems.orderId, data.orderId));
    await tx.insert(orderItems).values(
      validatedItems.map((item) => ({
        orderId: data.orderId,
        productId: item.productId,
        variantId: item.variantId,
        productName: item.productName,
        variantName: item.variantName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.unitPrice * item.quantity,
      })),
    );

    await logOrderEventTx(tx, {
      orderId: data.orderId,
      type: "DRAFT_UPDATED",
      data: { itemCount: validatedItems.length },
      createdBy: adminUserId,
    });

    updateTag("orders");
  });
}

export async function deleteDraftOrder(orderId: string) {
  const adminUserId = await requireAdmin();

  await db.transaction(async (tx) => {
    const order = await tx.query.orders.findFirst({
      where: and(eq(orders.id, orderId), eq(orders.status, "DRAFT")),
    });

    if (!order) {
      throw new Error("Draft order not found or is no longer a draft");
    }

    // Revert discount usedCount
    if (order.discountId) {
      await tx
        .update(discounts)
        .set({ usedCount: sql`GREATEST(${discounts.usedCount} - 1, 0)` })
        .where(eq(discounts.id, order.discountId));
    }

    await tx.delete(orderItems).where(eq(orderItems.orderId, orderId));
    await tx.delete(orders).where(eq(orders.id, orderId));
  });

  updateTag("orders");
}

export async function sendPaymentLink(input: SendPaymentLinkInput) {
  const adminUserId = await requireAdmin();
  const data = sendPaymentLinkSchema.parse(input);

  const order = await db.query.orders.findFirst({
    where: and(eq(orders.id, data.orderId), eq(orders.status, "DRAFT")),
    with: { items: true },
  });

  if (!order) {
    throw new Error("Draft order not found or is no longer a draft");
  }

  if (!order.customerEmail) {
    throw new Error("Customer email is required to send a payment link");
  }

  // Recalculate totals from current prices
  const recalculated = await db.transaction(async (tx) => {
    const validatedItems: CreateDraftOrderInput["items"] = [];
    for (const item of order.items) {
      const [product] = await tx
        .select()
        .from(products)
        .where(eq(products.id, item.productId));

      if (!product || product.status !== "ACTIVE") {
        throw new Error(`Product "${item.productName}" is no longer available`);
      }

      let unitPrice = product.basePrice;
      if (item.variantId) {
        const [variant] = await tx
          .select()
          .from(productVariants)
          .where(eq(productVariants.id, item.variantId));
        if (!variant) {
          throw new Error(`Variant not found for "${item.productName}"`);
        }
        unitPrice = product.basePrice + variant.priceAdjustment;
      }

      validatedItems.push({
        productId: item.productId,
        variantId: item.variantId,
        productName: item.productName,
        variantName: item.variantName,
        quantity: item.quantity,
        unitPrice,
        categoryId: product.categoryId,
      });
    }

    const totals = await calculateDraftTotals(
      tx,
      validatedItems,
      order.shippingCountry,
      order.discountCode ?? undefined,
      undefined, // Keep existing shipping
    );

    // Update order with recalculated totals if changed
    if (totals.total !== order.total) {
      await tx
        .update(orders)
        .set({
          subtotal: totals.subtotal,
          tax: totals.tax,
          shipping: totals.shippingCost,
          total: totals.total,
          discountAmount: totals.discountAmount,
        })
        .where(eq(orders.id, order.id));
    }

    // Reserve stock
    await createReservationsInTx(
      tx,
      validatedItems.map((item) => ({
        variantId: item.variantId,
        quantity: item.quantity,
        productName: item.productName,
      })),
      `draft-${order.id}`,
      order.id,
      1440, // 24 hours for payment link
    );

    return { ...totals, validatedItems };
  });

  // Create Stripe Checkout Session
  const stripe = getStripeServer();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: order.items.map((item) => ({
      price_data: {
        currency: (recalculated.currency || "CHF").toLowerCase(),
        unit_amount: item.unitPrice,
        product_data: {
          name: item.variantName
            ? `${item.productName} - ${item.variantName}`
            : item.productName,
        },
      },
      quantity: item.quantity,
    })),
    ...(recalculated.shippingCost > 0 && {
      shipping_options: [
        {
          shipping_rate_data: {
            display_name: order.shippingMethod || "Shipping",
            type: "fixed_amount" as const,
            fixed_amount: {
              amount: recalculated.shippingCost,
              currency: (recalculated.currency || "CHF").toLowerCase(),
            },
          },
        },
      ],
    }),
    metadata: {
      orderId: order.id,
      orderNumber: order.orderNumber,
      isDraftOrder: "true",
    },
    customer_email: order.customerEmail,
    success_url: `${appUrl}/en/order/${order.id}?token=${order.guestAccessToken}`,
    cancel_url: `${appUrl}/en/order/${order.id}?token=${order.guestAccessToken}&cancelled=true`,
    expires_at: Math.floor(Date.now() / 1000) + 86400, // 24 hours
  });

  // Transition DRAFT -> PENDING and store session info
  await db
    .update(orders)
    .set({
      status: "PENDING",
      stripeCheckoutSessionId: session.id,
      paymentLinkUrl: session.url,
      paymentLinkExpiresAt: new Date(Date.now() + 86400 * 1000),
      paymentLinkSentAt: new Date(),
    })
    .where(eq(orders.id, order.id));

  // Send payment link email
  const orderViewUrl = buildOrderViewUrl(order.id, order.guestAccessToken, "en");
  await sendPaymentLinkEmail(order.customerEmail, {
    orderNumber: order.orderNumber,
    items: order.items.map((item) => ({
      productName: item.productName,
      variantName: item.variantName,
      quantity: item.quantity,
      total: item.unitPrice * item.quantity,
    })),
    total: recalculated.total,
    currency: recalculated.currency,
    paymentUrl: session.url!,
    expiresAt: new Date(Date.now() + 86400 * 1000),
    customMessage: data.customMessage || undefined,
    orderViewUrl,
  });

  // Log events
  await logOrderEvent({
    orderId: order.id,
    type: "PAYMENT_LINK_SENT",
    data: {
      sessionId: session.id,
      paymentUrl: session.url,
      email: order.customerEmail,
    },
    createdBy: adminUserId,
  });
  await logOrderEvent({
    orderId: order.id,
    type: "STATUS_CHANGED",
    data: { from: "DRAFT", to: "PENDING" },
    createdBy: adminUserId,
  });

  updateTag("orders");

  return { paymentUrl: session.url! };
}

/**
 * Search products for adding to draft orders.
 * Returns ACTIVE products with variants and current stock.
 */
export async function searchProductsForDraft(query: string) {
  await requireAdmin();

  if (!query || query.trim().length < 2) return [];

  const { getProducts } = await import("@/server/queries/products");

  const result = await getProducts({
    status: "ACTIVE",
    search: query.trim(),
    limit: 10,
  });

  return result.items;
}
