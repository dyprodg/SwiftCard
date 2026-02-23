"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem, AppliedDiscount } from "@/types";

type CartState = {
  items: CartItem[];
  isLoading: boolean;
  isOpen: boolean; // sheet open state
  couponCode: string | null;
  appliedDiscount: AppliedDiscount | null;
};

type CartActions = {
  addItem: (item: CartItem) => void;
  updateQuantity: (productId: string, variantId: string | null, quantity: number) => void;
  removeItem: (productId: string, variantId: string | null) => void;
  clearCart: () => void;
  setItems: (items: CartItem[]) => void;
  setLoading: (loading: boolean) => void;
  setOpen: (open: boolean) => void;
  setCoupon: (code: string | null, discount: AppliedDiscount | null) => void;
};

type CartStore = CartState & CartActions;

function itemKey(productId: string, variantId: string | null): string {
  return `${productId}:${variantId ?? "default"}`;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set) => ({
      // State
      items: [],
      isLoading: false,
      isOpen: false,
      couponCode: null,
      appliedDiscount: null,

      // Actions
      addItem: (item) =>
        set((state) => {
          const existing = state.items.find(
            (i) =>
              itemKey(i.productId, i.variantId) ===
              itemKey(item.productId, item.variantId),
          );

          if (existing) {
            return {
              items: state.items.map((i) =>
                itemKey(i.productId, i.variantId) ===
                itemKey(item.productId, item.variantId)
                  ? { ...i, quantity: i.quantity + item.quantity }
                  : i,
              ),
            };
          }

          return { items: [...state.items, item] };
        }),

      updateQuantity: (productId, variantId, quantity) =>
        set((state) => {
          if (quantity <= 0) {
            return {
              items: state.items.filter(
                (i) =>
                  itemKey(i.productId, i.variantId) !== itemKey(productId, variantId),
              ),
            };
          }

          return {
            items: state.items.map((i) =>
              itemKey(i.productId, i.variantId) === itemKey(productId, variantId)
                ? { ...i, quantity }
                : i,
            ),
          };
        }),

      removeItem: (productId, variantId) =>
        set((state) => ({
          items: state.items.filter(
            (i) => itemKey(i.productId, i.variantId) !== itemKey(productId, variantId),
          ),
        })),

      clearCart: () => set({ items: [], couponCode: null, appliedDiscount: null }),

      setItems: (items) => set({ items }),

      setLoading: (isLoading) => set({ isLoading }),

      setOpen: (isOpen) => set({ isOpen }),

      setCoupon: (couponCode, appliedDiscount) => set({ couponCode, appliedDiscount }),
    }),
    {
      name: "swiftcard-cart",
      // Only persist items to localStorage
      partialize: (state) => ({ items: state.items }),
    },
  ),
);

// Computed selectors
export const selectTotalItems = (state: CartStore) =>
  state.items.reduce((sum, item) => sum + item.quantity, 0);

export const selectSubtotal = (state: CartStore) =>
  state.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

export const selectDiscountAmount = (state: CartStore) => {
  if (!state.appliedDiscount) return 0;
  const d = state.appliedDiscount;
  const isScoped = d.productIds.length > 0 || d.categoryIds.length > 0;

  const applicableSubtotal = state.items.reduce((sum, item) => {
    if (isScoped) {
      const matchesProduct = d.productIds.includes(item.productId);
      const matchesCategory =
        item.categoryId !== null && d.categoryIds.includes(item.categoryId);
      if (!matchesProduct && !matchesCategory) return sum;
    }
    return sum + item.unitPrice * item.quantity;
  }, 0);

  switch (d.type) {
    case "PERCENTAGE":
      return Math.round((applicableSubtotal * d.value) / 10000);
    case "FIXED":
      return Math.min(d.amount, applicableSubtotal);
    case "FREE_SHIPPING":
      return 0;
  }
};
