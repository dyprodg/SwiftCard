"use server";

import { db } from "@/db";
import { stockNotifications } from "@/db/schema";
import { stockNotificationSchema } from "@/lib/validations/stock-notification";

export async function subscribeStockNotification(input: {
  email: string;
  variantId: string;
  productId: string;
}): Promise<{ success: boolean; error?: string }> {
  const data = stockNotificationSchema.parse(input);

  try {
    await db
      .insert(stockNotifications)
      .values({
        email: data.email,
        variantId: data.variantId,
        productId: data.productId,
      })
      .onConflictDoNothing();

    return { success: true };
  } catch {
    return { success: false, error: "Failed to subscribe" };
  }
}
