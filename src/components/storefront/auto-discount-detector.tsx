"use client";

import { useEffect, useRef } from "react";
import { useCartStore, selectSubtotal } from "@/stores/cart-store";
import { getCartDiscount } from "@/server/actions/discounts";

/**
 * Detects and applies automatic discounts to the cart store.
 * Runs whenever cart items change and no manual coupon is applied.
 * Mount once in the storefront layout.
 */
export function AutoDiscountDetector() {
  const items = useCartStore((s) => s.items);
  const couponCode = useCartStore((s) => s.couponCode);
  const setCoupon = useCartStore((s) => s.setCoupon);
  const subtotal = useCartStore(selectSubtotal);
  const lastFetchKey = useRef("");

  useEffect(() => {
    // Don't override manual coupon
    if (couponCode) return;

    // Build a key from items to avoid redundant fetches
    const fetchKey = items
      .map((i) => `${i.productId}:${i.variantId ?? ""}:${i.quantity}`)
      .sort()
      .join("|");

    if (fetchKey === lastFetchKey.current) return;
    lastFetchKey.current = fetchKey;

    if (items.length === 0) {
      setCoupon(null, null);
      return;
    }

    // Small delay to let KV sync complete after add/update/remove
    const timer = setTimeout(() => {
      getCartDiscount()
        .then((discount) => {
          // Only set if still no manual coupon
          if (!useCartStore.getState().couponCode) {
            setCoupon(null, discount);
          }
        })
        .catch(() => {
          // Silently ignore — discount detection is best-effort
        });
    }, 300);

    return () => clearTimeout(timer);
  }, [items, couponCode, setCoupon, subtotal]);

  return null;
}
