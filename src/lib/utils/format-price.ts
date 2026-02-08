/**
 * Format a price in cents to a display string.
 * All prices are stored as integers in the smallest currency unit (Rappen for CHF).
 */
export function formatPrice(
  priceInCents: number,
  currency: string = "CHF",
  locale: string = "de-CH",
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(priceInCents / 100);
}
