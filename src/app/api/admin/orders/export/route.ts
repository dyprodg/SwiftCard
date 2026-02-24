import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { orders } from "@/db/schema/orders";
import { desc, and, eq, ilike, or, gte, lte } from "drizzle-orm";
import { formatPrice } from "@/lib/utils/format-price";

export async function GET(req: NextRequest) {
  // Admin auth check
  const { userId, sessionClaims } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (role !== "admin") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const params = req.nextUrl.searchParams;
  const status = params.get("status") || undefined;
  const paymentStatus = params.get("paymentStatus") || undefined;
  const fulfillmentStatus = params.get("fulfillmentStatus") || undefined;
  const search = params.get("search") || undefined;
  const dateFrom = params.get("dateFrom") || undefined;
  const dateTo = params.get("dateTo") || undefined;
  const amountMin = params.get("amountMin") ? Number(params.get("amountMin")) : undefined;
  const amountMax = params.get("amountMax") ? Number(params.get("amountMax")) : undefined;

  const conditions = [];

  if (status) {
    conditions.push(
      eq(orders.status, status as (typeof orders.status.enumValues)[number]),
    );
  }
  if (paymentStatus) {
    conditions.push(
      eq(
        orders.paymentStatus,
        paymentStatus as (typeof orders.paymentStatus.enumValues)[number],
      ),
    );
  }
  if (fulfillmentStatus) {
    conditions.push(
      eq(
        orders.fulfillmentStatus,
        fulfillmentStatus as (typeof orders.fulfillmentStatus.enumValues)[number],
      ),
    );
  }
  if (search) {
    conditions.push(
      or(
        ilike(orders.orderNumber, `%${search}%`),
        ilike(orders.customerEmail, `%${search}%`),
        ilike(orders.shippingName, `%${search}%`),
      ),
    );
  }
  if (dateFrom) {
    conditions.push(gte(orders.createdAt, new Date(dateFrom)));
  }
  if (dateTo) {
    const endDate = new Date(dateTo);
    endDate.setDate(endDate.getDate() + 1);
    conditions.push(lte(orders.createdAt, endDate));
  }
  if (amountMin && amountMin > 0) {
    conditions.push(gte(orders.total, amountMin));
  }
  if (amountMax && amountMax > 0) {
    conditions.push(lte(orders.total, amountMax));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const data = await db
    .select()
    .from(orders)
    .where(where)
    .orderBy(desc(orders.createdAt))
    .limit(10000);

  // Build CSV
  const headers = [
    "Order Number",
    "Date",
    "Status",
    "Payment Status",
    "Fulfillment Status",
    "Customer Name",
    "Email",
    "Address",
    "Subtotal",
    "Tax",
    "Shipping",
    "Discount",
    "Total",
    "Currency",
  ];

  const escapeCSV = (val: string) => {
    if (val.includes(",") || val.includes('"') || val.includes("\n")) {
      return `"${val.replace(/"/g, '""')}"`;
    }
    return val;
  };

  const rows = data.map((order) => {
    const address = [
      order.shippingAddress1,
      order.shippingAddress2,
      `${order.shippingZip} ${order.shippingCity}`,
      order.shippingCountry,
    ]
      .filter(Boolean)
      .join(", ");

    return [
      order.orderNumber,
      new Date(order.createdAt).toISOString().slice(0, 10),
      order.status,
      order.paymentStatus,
      order.fulfillmentStatus,
      order.shippingName,
      order.customerEmail,
      address,
      formatPrice(order.subtotal, order.currency),
      formatPrice(order.tax, order.currency),
      formatPrice(order.shipping, order.currency),
      formatPrice(order.discountAmount, order.currency),
      formatPrice(order.total, order.currency),
      order.currency,
    ]
      .map(escapeCSV)
      .join(",");
  });

  const csv = [headers.join(","), ...rows].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="orders-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
