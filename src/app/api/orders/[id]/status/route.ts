import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders } from "@/db/schema/orders";
import { eq } from "drizzle-orm";
import { reconcileOrderWithStripe } from "@/lib/stripe/reconcile";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const token = req.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  const order = await db.query.orders.findFirst({
    where: eq(orders.id, id),
  });

  if (!order || order.guestAccessToken !== token) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // If already resolved, return immediately (no Stripe call)
  if (order.paymentStatus !== "PENDING") {
    return NextResponse.json({
      paymentStatus: order.paymentStatus,
      status: order.status,
    });
  }

  // PENDING — try to reconcile with Stripe
  await reconcileOrderWithStripe(id);

  // Re-read to get the potentially updated status
  const updated = await db.query.orders.findFirst({
    where: eq(orders.id, id),
  });

  return NextResponse.json({
    paymentStatus: updated?.paymentStatus ?? order.paymentStatus,
    status: updated?.status ?? order.status,
  });
}
