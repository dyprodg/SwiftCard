/**
 * Pure utility for filtering shipping rates, calculating prices and tax.
 * No DB dependency — can be unit tested.
 */

export type ShippingRateInput = {
  id: string;
  name: string;
  type: "FLAT" | "WEIGHT_BASED" | "PRICE_BASED";
  price: number; // cents
  minValue: number | null;
  maxValue: number | null;
  freeAbove: number | null; // cents
};

export type ShippingOption = {
  id: string;
  name: string;
  price: number; // cents (0 if free threshold met)
  originalPrice?: number; // if free, shows original for strikethrough
};

/**
 * Calculate tax and total for an order.
 * - Tax-inclusive: prices already contain tax. Tax is extracted for display.
 *   Total = discountedSubtotal + shippingCost (tax NOT added)
 * - Tax-exclusive: tax is added on top.
 *   Total = discountedSubtotal + tax + shippingCost
 */
export function calculateTaxAndTotal(
  discountedSubtotal: number,
  shippingCost: number,
  taxRate: number,
  taxInclusive: boolean,
): { tax: number; total: number } {
  const tax = taxInclusive
    ? Math.round((discountedSubtotal * taxRate) / (1 + taxRate))
    : Math.round(discountedSubtotal * taxRate);
  const total = taxInclusive
    ? discountedSubtotal + shippingCost
    : discountedSubtotal + tax + shippingCost;
  return { tax, total };
}

/**
 * Filters shipping rates by cart weight and subtotal,
 * then applies free-above thresholds.
 */
export function filterApplicableRates(
  rates: ShippingRateInput[],
  cartWeightGrams: number,
  subtotalCents: number,
): ShippingOption[] {
  return rates
    .filter((rate) => {
      switch (rate.type) {
        case "FLAT":
          return true;
        case "WEIGHT_BASED": {
          const min = rate.minValue ?? 0;
          const max = rate.maxValue ?? Infinity;
          return cartWeightGrams >= min && cartWeightGrams <= max;
        }
        case "PRICE_BASED": {
          const min = rate.minValue ?? 0;
          const max = rate.maxValue ?? Infinity;
          return subtotalCents >= min && subtotalCents <= max;
        }
        default:
          return false;
      }
    })
    .map((rate) => {
      const isFree = rate.freeAbove !== null && subtotalCents >= rate.freeAbove;
      return {
        id: rate.id,
        name: rate.name,
        price: isFree ? 0 : rate.price,
        ...(isFree ? { originalPrice: rate.price } : {}),
      };
    });
}
