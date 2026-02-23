import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { orders } from "@/db/schema/orders";
import { and, eq, isNotNull, lt } from "drizzle-orm";
import { reconcileOrderWithStripe } from "@/lib/stripe/reconcile";
import { expireReservations } from "@/lib/reservations";

export async function POST() {
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  if (!userId || role !== "admin") {
    return new NextResponse("Not Found", { status: 404 });
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
    } else {
      // Expire dangling reservations for stale orders that weren't reconciled
      await expireReservations(order.id);
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
