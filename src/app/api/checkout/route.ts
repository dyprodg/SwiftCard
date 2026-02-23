import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/db";
import { products, productVariants, shopSettings, discounts } from "@/db/schema";
import { orders, orderItems } from "@/db/schema/orders";
import { eq, sql, and, or, isNull, lte, gte } from "drizzle-orm";
import { stripe } from "@/lib/stripe/client";
import { getCart, guestCartKey, rateLimit } from "@/lib/kv";
import { checkoutSchema } from "@/lib/validations/checkout";
import { generateOrderNumber } from "@/lib/utils/order-number";
import { buildOrderViewUrl } from "@/lib/utils/order-url";
import { sendOrderCreatedEmail } from "@/lib/resend";
import {
  calculateDiscount,
  findBestAutomaticDiscount,
} from "@/lib/utils/discount-calculator";

export async function POST(req: NextRequest) {
  try {
    // Rate limit by IP: 10 requests per 60 seconds
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const ipLimit = await rateLimit(`checkout:ip:${ip}`, 10, 60);
    if (!ipLimit.success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429, headers: { "Retry-After": "60" } },
      );
    }

    // Session idempotency: 1 request per 5 seconds per session
    const cookieStore = await cookies();
    const sessionId = cookieStore.get("cart_session")?.value;
    if (sessionId) {
      const sessionLimit = await rateLimit(`checkout:session:${sessionId}`, 1, 5);
      if (!sessionLimit.success) {
        return NextResponse.json(
          { error: "Please wait before submitting again." },
          { status: 429, headers: { "Retry-After": "5" } },
        );
      }
    }

    // Parse & validate body
    const body = await req.json();
    const validation = checkoutSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid checkout data", details: validation.error.flatten() },
        { status: 400 },
      );
    }

    const { shippingAddress, customerEmail, customerNote, couponCode } = validation.data;

    // Get cart via cookie (works for both guests and logged-in users)
    // API routes are excluded from Clerk middleware, so we use the cart_session cookie
    if (!sessionId) {
      return NextResponse.json({ error: "No cart session" }, { status: 400 });
    }
    const cartId = guestCartKey(sessionId);

    const cartItems = await getCart(cartId);
    if (cartItems.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    // Validate cart items and lock stock in a transaction
    const result = await db.transaction(async (tx) => {
      let subtotal = 0;
      const validatedItems: {
        productId: string;
        variantId: string | null;
        productName: string;
        variantName: string | null;
        quantity: number;
        unitPrice: number;
        categoryId: string | null;
      }[] = [];

      for (const item of cartItems) {
        // Verify product exists and is active
        const [product] = await tx
          .select()
          .from(products)
          .where(eq(products.id, item.productId));

        if (!product || product.status !== "ACTIVE") {
          throw new Error(`Product "${item.productName}" is no longer available`);
        }

        let unitPrice = product.basePrice;

        // If there's a variant, verify stock and lock it
        if (item.variantId) {
          const result = await tx
            .update(productVariants)
            .set({
              stock: sql`${productVariants.stock} - ${item.quantity}`,
            })
            .where(
              sql`${productVariants.id} = ${item.variantId} AND ${productVariants.stock} >= ${item.quantity}`,
            )
            .returning();

          if (result.length === 0) {
            throw new Error(`Not enough stock for "${item.productName}"`);
          }

          unitPrice = product.basePrice + result[0].priceAdjustment;
        }

        const lineTotal = unitPrice * item.quantity;
        subtotal += lineTotal;

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

      // ===== DISCOUNT CALCULATION =====
      let discountId: string | null = null;
      let discountAmount = 0;
      let discountCode: string | null = null;
      let freeShipping = false;

      const enrichedItems = validatedItems.map((item) => ({
        productId: item.productId,
        categoryId: item.categoryId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      }));

      if (couponCode) {
        // Validate coupon code
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

        if (!discount) {
          throw new Error("Invalid or expired coupon code");
        }

        if (discount.maxUses && discount.usedCount >= discount.maxUses) {
          throw new Error("This coupon has reached its usage limit");
        }

        // Per-customer usage check
        if (discount.maxUsesPerCustomer) {
          const [usageResult] = await tx
            .select({ count: sql<number>`count(*)::int` })
            .from(orders)
            .where(
              and(
                eq(orders.discountId, discount.id),
                eq(orders.customerEmail, customerEmail),
              ),
            );
          if ((usageResult?.count ?? 0) >= discount.maxUsesPerCustomer) {
            throw new Error("You have already used this coupon the maximum number of times");
          }
        }

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

          // Increment usedCount atomically
          await tx
            .update(discounts)
            .set({ usedCount: sql`${discounts.usedCount} + 1` })
            .where(eq(discounts.id, discount.id));
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

            // Increment usedCount atomically
            await tx
              .update(discounts)
              .set({ usedCount: sql`${discounts.usedCount} + 1` })
              .where(eq(discounts.id, best.discountId));
          }
        }
      }

      // ===== TOTALS =====
      const discountedSubtotal = subtotal - discountAmount;

      // Get shop settings for tax & shipping
      const [settings] = await tx
        .select()
        .from(shopSettings)
        .where(eq(shopSettings.id, "singleton"));

      const taxRate = settings?.defaultTaxRate ?? 0.081;
      const baseShippingCost =
        settings?.freeShippingThreshold && subtotal >= settings.freeShippingThreshold
          ? 0
          : (settings?.defaultShippingCost ?? 0);
      const shippingCost = freeShipping ? 0 : baseShippingCost;
      const currency = settings?.currency ?? "CHF";

      const tax = Math.round(discountedSubtotal * taxRate);
      const total = discountedSubtotal + tax + shippingCost;

      // Generate order number (simple sequential)
      const [countResult] = await tx
        .select({ count: sql<number>`count(*)::int` })
        .from(orders);
      const orderNumber = generateOrderNumber((countResult?.count ?? 0) + 1);

      // Insert order
      const [order] = await tx
        .insert(orders)
        .values({
          orderNumber,
          status: "PENDING",
          paymentStatus: "PENDING",
          fulfillmentStatus: "UNFULFILLED",
          subtotal,
          tax,
          shipping: shippingCost,
          total,
          currency,
          customerId: null, // Guest checkout — linked by email
          customerEmail,
          shippingName: shippingAddress.name,
          shippingAddress1: shippingAddress.address1,
          shippingAddress2: shippingAddress.address2 || null,
          shippingCity: shippingAddress.city,
          shippingZip: shippingAddress.zip,
          shippingCountry: shippingAddress.country,
          customerNote: customerNote || null,
          discountId,
          discountAmount,
          discountCode,
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

      return { order, validatedItems, total, currency, discountCode, discountAmount };
    });

    // Create Stripe PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: result.total,
      currency: result.currency.toLowerCase(),
      metadata: {
        orderId: result.order.id,
        orderNumber: result.order.orderNumber,
        cartId,
        customerEmail,
        ...(result.discountCode && { discountCode: result.discountCode }),
        ...(result.discountAmount > 0 && {
          discountAmount: result.discountAmount.toString(),
        }),
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    // Store the payment intent ID on the order
    await db
      .update(orders)
      .set({ stripePaymentIntentId: paymentIntent.id })
      .where(eq(orders.id, result.order.id));

    // Send order-created email (fire-and-forget)
    const orderViewUrl = buildOrderViewUrl(
      result.order.id,
      result.order.guestAccessToken,
      "en",
    );
    sendOrderCreatedEmail(result.order.customerEmail, {
      orderNumber: result.order.orderNumber,
      items: result.validatedItems.map((item) => ({
        productName: item.productName,
        variantName: item.variantName,
        quantity: item.quantity,
        total: item.unitPrice * item.quantity,
      })),
      total: result.total,
      currency: result.currency,
      orderViewUrl,
    }).catch((err) => console.error("Failed to send order-created email:", err));

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      orderId: result.order.id,
    });
  } catch (error) {
    console.error("Checkout error:", error);
    const message = error instanceof Error ? error.message : "Checkout failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
