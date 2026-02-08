"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem } from "@/types";

type CartState = {
  items: CartItem[];
  isLoading: boolean;
  isOpen: boolean; // sheet open state
};

type CartActions = {
  addItem: (item: CartItem) => void;
  updateQuantity: (productId: string, variantId: string | null, quantity: number) => void;
  removeItem: (productId: string, variantId: string | null) => void;
  clearCart: () => void;
  setItems: (items: CartItem[]) => void;
  setLoading: (loading: boolean) => void;
  setOpen: (open: boolean) => void;
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

      clearCart: () => set({ items: [] }),

      setItems: (items) => set({ items }),

      setLoading: (isLoading) => set({ isLoading }),

      setOpen: (isOpen) => set({ isOpen }),
    }),
    {
      name: "swiftcart-cart",
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
