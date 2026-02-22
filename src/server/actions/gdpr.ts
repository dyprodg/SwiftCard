"use server";

import { auth, currentUser, clerkClient } from "@clerk/nextjs/server";
import { db } from "@/db";
import { orders } from "@/db/schema/orders";
import { eq } from "drizzle-orm";

export async function exportUserData() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await currentUser();
  if (!user) throw new Error("User not found");

  const email = user.emailAddresses[0]?.emailAddress;
  if (!email) throw new Error("No email associated with account");

  // Get all orders with items
  const userOrders = await db.query.orders.findMany({
    where: eq(orders.customerEmail, email),
    with: { items: true },
  });

  return {
    profile: {
      id: user.id,
      email,
      firstName: user.firstName,
      lastName: user.lastName,
      createdAt: user.createdAt,
    },
    orders: userOrders.map((order) => ({
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.paymentStatus,
      total: order.total,
      currency: order.currency,
      shippingName: order.shippingName,
      shippingAddress1: order.shippingAddress1,
      shippingAddress2: order.shippingAddress2,
      shippingCity: order.shippingCity,
      shippingZip: order.shippingZip,
      shippingCountry: order.shippingCountry,
      createdAt: order.createdAt,
      items: order.items.map((item) => ({
        productName: item.productName,
        variantName: item.variantName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.total,
      })),
    })),
    exportedAt: new Date().toISOString(),
  };
}

export async function deleteUserAccount(): Promise<{ success: boolean; error?: string }> {
  const { userId } = await auth();
  if (!userId) return { success: false, error: "Unauthorized" };

  const user = await currentUser();
  if (!user) return { success: false, error: "User not found" };

  const email = user.emailAddresses[0]?.emailAddress;
  if (!email) return { success: false, error: "No email associated with account" };

  try {
    // Anonymize all orders for this user (retain for Swiss 10-year accounting)
    const userOrders = await db
      .select({ id: orders.id })
      .from(orders)
      .where(eq(orders.customerEmail, email));

    for (const order of userOrders) {
      await db
        .update(orders)
        .set({
          customerEmail: `deleted-${order.id}@anonymized.local`,
          customerId: null,
          billingName: null,
          billingAddress1: null,
          billingAddress2: null,
          billingCity: null,
          billingZip: null,
          billingCountry: null,
          shippingName: "DELETED",
          shippingAddress1: "DELETED",
          shippingAddress2: null,
          shippingCity: "DELETED",
          shippingZip: "DELETED",
          // shippingCountry kept as non-PII
          customerNote: null,
        })
        .where(eq(orders.id, order.id));
    }

    // Delete user from Clerk
    const client = await clerkClient();
    await client.users.deleteUser(userId);

    return { success: true };
  } catch (error) {
    console.error("Failed to delete user account:", error);
    return {
      success: false,
      error: "Failed to delete account. Please try again.",
    };
  }
}
