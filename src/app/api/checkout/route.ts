import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/db";
import { products, productVariants, shopSettings } from "@/db/schema";
import { orders, orderItems } from "@/db/schema/orders";
import { eq, sql } from "drizzle-orm";
import { stripe } from "@/lib/stripe/client";
import { getCart, guestCartKey, rateLimit } from "@/lib/kv";
import { checkoutSchema } from "@/lib/validations/checkout";
import { generateOrderNumber } from "@/lib/utils/order-number";
import { buildOrderViewUrl } from "@/lib/utils/order-url";
import { sendOrderCreatedEmail } from "@/lib/resend";

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

    const { shippingAddress, customerEmail, customerNote } = validation.data;

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
        });
      }

      // Get shop settings for tax & shipping
      const [settings] = await tx
        .select()
        .from(shopSettings)
        .where(eq(shopSettings.id, "singleton"));

      const taxRate = settings?.defaultTaxRate ?? 0.081;
      const shippingCost =
        settings?.freeShippingThreshold && subtotal >= settings.freeShippingThreshold
          ? 0
          : (settings?.defaultShippingCost ?? 0);
      const currency = settings?.currency ?? "CHF";

      const tax = Math.round(subtotal * taxRate);
      const total = subtotal + tax + shippingCost;

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

      return { order, validatedItems, total, currency };
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
