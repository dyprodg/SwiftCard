import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { db } from "@/db";
import { products, productVariants, shopSettings } from "@/db/schema";
import { orders, orderItems } from "@/db/schema/orders";
import { eq, sql } from "drizzle-orm";
import { stripe } from "@/lib/stripe/client";
import { getCart, cartKey, guestCartKey } from "@/lib/kv";
import { checkoutSchema } from "@/lib/validations/checkout";
import { generateOrderNumber } from "@/lib/utils/order-number";

export async function POST(req: NextRequest) {
  try {
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

    // Get cart
    const { userId } = await auth();
    let cartId: string;

    if (userId) {
      cartId = cartKey(userId);
    } else {
      const cookieStore = await cookies();
      const sessionId = cookieStore.get("cart_session")?.value;
      if (!sessionId) {
        return NextResponse.json({ error: "No cart session" }, { status: 400 });
      }
      cartId = guestCartKey(sessionId);
    }

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
          customerId: userId ?? null,
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

      return { order, total, currency };
    });

    // Create Stripe PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: result.total,
      currency: result.currency.toLowerCase(),
      metadata: {
        orderId: result.order.id,
        orderNumber: result.order.orderNumber,
        cartId,
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
