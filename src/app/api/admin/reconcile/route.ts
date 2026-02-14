import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { orders } from "@/db/schema/orders";
import { and, eq, isNotNull, lt } from "drizzle-orm";
import { reconcileOrderWithStripe } from "@/lib/stripe/reconcile";

export async function POST() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Find stale PENDING orders (older than 15 minutes) with a Stripe PI
  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

  const staleOrders = await db
    .select({ id: orders.id, orderNumber: orders.orderNumber })
    .from(orders)
    .where(
      and(
        eq(orders.paymentStatus, "PENDING"),
        isNotNull(orders.stripePaymentIntentId),
        lt(orders.createdAt, fifteenMinutesAgo),
      ),
    );

  const details: { orderId: string; orderNumber: string; result: string }[] = [];
  let reconciled = 0;

  for (const order of staleOrders) {
    const result = await reconcileOrderWithStripe(order.id);
    if (result.reconciled) {
      reconciled++;
    }
    details.push({
      orderId: order.id,
      orderNumber: order.orderNumber,
      result: result.reconciled ? "reconciled" : result.reason,
    });
  }

  return NextResponse.json({
    checked: staleOrders.length,
    reconciled,
    details,
  });
}
