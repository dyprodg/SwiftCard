"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

const MAX_ITEMS = 10;

type RecentlyViewedState = {
  productIds: string[];
};

type RecentlyViewedActions = {
  addProduct: (productId: string) => void;
  clear: () => void;
};

type RecentlyViewedStore = RecentlyViewedState & RecentlyViewedActions;

export const useRecentlyViewedStore = create<RecentlyViewedStore>()(
  persist(
    (set) => ({
      productIds: [],

      addProduct: (productId) =>
        set((state) => {
          const filtered = state.productIds.filter((id) => id !== productId);
          return { productIds: [productId, ...filtered].slice(0, MAX_ITEMS) };
        }),

      clear: () => set({ productIds: [] }),
    }),
    {
      name: "swiftcard-recently-viewed",
    },
  ),
);
