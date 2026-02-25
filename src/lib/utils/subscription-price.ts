/**
 * Calculate the subscription price after applying a discount.
 * @param basePrice - product base price in cents
 * @param priceAdjustment - variant price adjustment in cents (0 if no variant)
 * @param discountPercent - discount in basis points (0-10000, e.g. 1000 = 10%)
 * @returns price in cents
 */
export function calculateSubscriptionPrice(
  basePrice: number,
  priceAdjustment: number,
  discountPercent: number,
): number {
  const fullPrice = basePrice + priceAdjustment;
  if (discountPercent <= 0) return fullPrice;
  if (discountPercent >= 10000) return 0;
  return Math.round(fullPrice * (1 - discountPercent / 10000));
}

/**
 * Map our interval enum to Stripe recurring params.
 */
export function toStripeInterval(
  interval: "WEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY",
) {
  switch (interval) {
    case "WEEKLY":
      return { interval: "week" as const, interval_count: 1 };
    case "MONTHLY":
      return { interval: "month" as const, interval_count: 1 };
    case "QUARTERLY":
      return { interval: "month" as const, interval_count: 3 };
    case "YEARLY":
      return { interval: "year" as const, interval_count: 1 };
  }
}

/**
 * Human-readable interval label key for i18n.
 */
export function intervalKey(interval: "WEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY") {
  switch (interval) {
    case "WEEKLY":
      return "perWeek";
    case "MONTHLY":
      return "perMonth";
    case "QUARTERLY":
      return "perQuarter";
    case "YEARLY":
      return "perYear";
  }
}
