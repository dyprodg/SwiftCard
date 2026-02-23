import { describe, it, expect, beforeEach } from "vitest";
import { useCartStore, selectTotalItems, selectSubtotal } from "./cart-store";
import type { CartItem } from "@/types";

function makeItem(overrides: Partial<CartItem> = {}): CartItem {
  return {
    productId: "prod-1",
    variantId: null,
    quantity: 1,
    productName: "Test Product",
    variantName: null,
    unitPrice: 1000,
    imageUrl: null,
    categoryId: null,
    ...overrides,
  };
}

describe("cart-store", () => {
  beforeEach(() => {
    useCartStore.setState({ items: [], isLoading: false, isOpen: false });
  });

  describe("addItem", () => {
    it("adds a new item", () => {
      useCartStore.getState().addItem(makeItem());
      expect(useCartStore.getState().items).toHaveLength(1);
    });

    it("merges duplicate (same product+variant)", () => {
      useCartStore.getState().addItem(makeItem({ quantity: 2 }));
      useCartStore.getState().addItem(makeItem({ quantity: 3 }));
      const items = useCartStore.getState().items;
      expect(items).toHaveLength(1);
      expect(items[0].quantity).toBe(5);
    });

    it("keeps different variants separate", () => {
      useCartStore.getState().addItem(makeItem({ variantId: "v1" }));
      useCartStore.getState().addItem(makeItem({ variantId: "v2" }));
      expect(useCartStore.getState().items).toHaveLength(2);
    });

    it("keeps different products separate", () => {
      useCartStore.getState().addItem(makeItem({ productId: "a" }));
      useCartStore.getState().addItem(makeItem({ productId: "b" }));
      expect(useCartStore.getState().items).toHaveLength(2);
    });
  });

  describe("updateQuantity", () => {
    it("updates existing item quantity", () => {
      useCartStore.getState().addItem(makeItem());
      useCartStore.getState().updateQuantity("prod-1", null, 5);
      expect(useCartStore.getState().items[0].quantity).toBe(5);
    });

    it("removes item when quantity is 0", () => {
      useCartStore.getState().addItem(makeItem());
      useCartStore.getState().updateQuantity("prod-1", null, 0);
      expect(useCartStore.getState().items).toHaveLength(0);
    });

    it("removes item when quantity is negative", () => {
      useCartStore.getState().addItem(makeItem());
      useCartStore.getState().updateQuantity("prod-1", null, -1);
      expect(useCartStore.getState().items).toHaveLength(0);
    });
  });

  describe("removeItem", () => {
    it("removes by productId and variantId", () => {
      useCartStore.getState().addItem(makeItem({ variantId: "v1" }));
      useCartStore.getState().addItem(makeItem({ variantId: "v2" }));
      useCartStore.getState().removeItem("prod-1", "v1");
      const items = useCartStore.getState().items;
      expect(items).toHaveLength(1);
      expect(items[0].variantId).toBe("v2");
    });

    it("removes item with null variant", () => {
      useCartStore.getState().addItem(makeItem());
      useCartStore.getState().removeItem("prod-1", null);
      expect(useCartStore.getState().items).toHaveLength(0);
    });
  });

  describe("clearCart", () => {
    it("removes all items", () => {
      useCartStore.getState().addItem(makeItem({ productId: "a" }));
      useCartStore.getState().addItem(makeItem({ productId: "b" }));
      useCartStore.getState().clearCart();
      expect(useCartStore.getState().items).toHaveLength(0);
    });
  });

  describe("setItems", () => {
    it("replaces all items", () => {
      useCartStore.getState().addItem(makeItem());
      const newItems = [makeItem({ productId: "x" }), makeItem({ productId: "y" })];
      useCartStore.getState().setItems(newItems);
      expect(useCartStore.getState().items).toHaveLength(2);
      expect(useCartStore.getState().items[0].productId).toBe("x");
    });
  });

  describe("selectTotalItems", () => {
    it("sums quantities", () => {
      useCartStore.setState({
        items: [makeItem({ quantity: 3 }), makeItem({ productId: "b", quantity: 7 })],
      });
      expect(selectTotalItems(useCartStore.getState())).toBe(10);
    });

    it("returns 0 for empty cart", () => {
      expect(selectTotalItems(useCartStore.getState())).toBe(0);
    });
  });

  describe("selectSubtotal", () => {
    it("sums unitPrice * quantity", () => {
      useCartStore.setState({
        items: [
          makeItem({ unitPrice: 1000, quantity: 2 }),
          makeItem({ productId: "b", unitPrice: 500, quantity: 3 }),
        ],
      });
      expect(selectSubtotal(useCartStore.getState())).toBe(3500);
    });

    it("returns 0 for empty cart", () => {
      expect(selectSubtotal(useCartStore.getState())).toBe(0);
    });
  });
});
