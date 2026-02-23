import type { Discount, AppliedDiscount } from "@/types";

type CartItemForDiscount = {
  productId: string;
  categoryId: string | null;
  quantity: number;
  unitPrice: number; // cents
};

type DiscountWithScope = Discount & {
  productIds: string[];
  categoryIds: string[];
};

export type DiscountCalculationResult = {
  discountId: string;
  code: string | null;
  name: string;
  type: "PERCENTAGE" | "FIXED" | "FREE_SHIPPING";
  value: number;
  amount: number; // discount amount in cents
  freeShipping: boolean;
};

/**
 * Calculate the discount amount for a given discount and cart.
 * Returns null if the discount doesn't apply (e.g. minOrderAmount not met).
 */
export function calculateDiscount(
  discount: DiscountWithScope,
  cartItems: CartItemForDiscount[],
  subtotal: number,
): DiscountCalculationResult | null {
  // Check minimum order amount
  if (discount.minOrderAmount && subtotal < discount.minOrderAmount) {
    return null;
  }

  // Check date validity
  const now = new Date();
  if (discount.startsAt && now < discount.startsAt) return null;
  if (discount.expiresAt && now > discount.expiresAt) return null;

  // Check usage limits
  if (discount.maxUses && discount.usedCount >= discount.maxUses) return null;

  // Determine applicable subtotal (scoped vs global)
  const isScoped = discount.productIds.length > 0 || discount.categoryIds.length > 0;
  let applicableSubtotal = subtotal;

  if (isScoped) {
    applicableSubtotal = cartItems.reduce((sum, item) => {
      const matchesProduct = discount.productIds.includes(item.productId);
      const matchesCategory =
        item.categoryId !== null && discount.categoryIds.includes(item.categoryId);
      if (matchesProduct || matchesCategory) {
        return sum + item.unitPrice * item.quantity;
      }
      return sum;
    }, 0);

    if (applicableSubtotal === 0) return null;
  }

  let amount = 0;
  let freeShipping = false;

  switch (discount.type) {
    case "PERCENTAGE":
      amount = Math.round((applicableSubtotal * discount.value) / 10000);
      break;
    case "FIXED":
      amount = Math.min(discount.value, applicableSubtotal);
      break;
    case "FREE_SHIPPING":
      amount = 0;
      freeShipping = true;
      break;
  }

  return {
    discountId: discount.id,
    code: discount.code,
    name: discount.name,
    type: discount.type,
    value: discount.value,
    amount,
    freeShipping,
  };
}

/**
 * Find the best automatic discount from a list.
 * "Best" = highest monetary discount amount, or free shipping if no amount discounts apply.
 */
export function findBestAutomaticDiscount(
  autoDiscounts: DiscountWithScope[],
  cartItems: CartItemForDiscount[],
  subtotal: number,
): DiscountCalculationResult | null {
  let best: DiscountCalculationResult | null = null;

  for (const discount of autoDiscounts) {
    const result = calculateDiscount(discount, cartItems, subtotal);
    if (!result) continue;

    if (!best) {
      best = result;
      continue;
    }

    // Prefer higher monetary discount; fall back to free shipping
    if (result.amount > best.amount) {
      best = result;
    } else if (result.amount === best.amount && result.freeShipping && !best.freeShipping) {
      best = result;
    }
  }

  return best;
}

/**
 * Convert a DiscountCalculationResult to an AppliedDiscount for client display.
 */
export function toAppliedDiscount(result: DiscountCalculationResult): AppliedDiscount {
  return {
    id: result.discountId,
    code: result.code,
    name: result.name,
    type: result.type,
    value: result.value,
    amount: result.amount,
    freeShipping: result.freeShipping,
  };
}
