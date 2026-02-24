import { db } from "@/db";
import { stockNotifications, productVariants, products } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { sendBackInStockEmail } from "@/lib/resend";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://localhost:3000";

/**
 * Trigger back-in-stock notifications for a variant that was just restocked.
 * Marks each notification as sent (notifiedAt) to prevent duplicates.
 */
export async function triggerStockNotifications(variantId: string) {
  // Find pending notifications for this variant
  const notifications = await db.query.stockNotifications.findMany({
    where: and(
      eq(stockNotifications.variantId, variantId),
      isNull(stockNotifications.notifiedAt),
    ),
  });

  if (notifications.length === 0) return;

  // Fetch variant + product info for email
  const variant = await db.query.productVariants.findFirst({
    where: eq(productVariants.id, variantId),
  });
  if (!variant || variant.stock <= 0) return;

  const product = await db.query.products.findFirst({
    where: eq(products.id, variant.productId),
  });
  if (!product) return;

  const productUrl = `${APP_URL}/en/products/${product.slug}`;
  const variantName =
    [variant.size, variant.color, variant.material].filter(Boolean).join(" / ") ||
    undefined;

  // Send emails and mark as notified
  for (const notification of notifications) {
    try {
      await sendBackInStockEmail(notification.email, {
        productName: product.name,
        productUrl,
        variantName,
      });

      await db
        .update(stockNotifications)
        .set({ notifiedAt: new Date() })
        .where(eq(stockNotifications.id, notification.id));
    } catch (error) {
      console.error(
        `Failed to send back-in-stock email to ${notification.email}:`,
        error,
      );
    }
  }
}

/**
 * Call after restoring stock (e.g. in refund or admin stock update).
 * Only triggers if the variant now has stock > 0.
 */
export async function checkAndNotifyStockRestore(variantId: string) {
  const variant = await db.query.productVariants.findFirst({
    where: eq(productVariants.id, variantId),
    columns: { stock: true },
  });

  if (variant && variant.stock > 0) {
    await triggerStockNotifications(variantId);
  }
}
