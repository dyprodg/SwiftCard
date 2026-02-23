import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock drizzle-orm operators
vi.mock("drizzle-orm", () => ({
  eq: vi.fn((...args: unknown[]) => ({ type: "eq", args })),
  and: vi.fn((...args: unknown[]) => ({ type: "and", args })),
  sql: vi.fn(),
  lte: vi.fn((...args: unknown[]) => ({ type: "lte", args })),
  inArray: vi.fn((...args: unknown[]) => ({ type: "inArray", args })),
}));

// Mock DB
const mockUpdate = vi.fn();
const mockInsert = vi.fn();
const mockSelect = vi.fn();

vi.mock("@/db", () => ({
  db: {
    update: (...args: unknown[]) => {
      mockUpdate(...args);
      return {
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([{ id: "v1", stock: 10 }]),
          }),
        }),
      };
    },
    insert: (...args: unknown[]) => {
      mockInsert(...args);
      return {
        values: vi.fn().mockResolvedValue(undefined),
      };
    },
    select: (...args: unknown[]) => {
      mockSelect(...args);
      return {
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
          innerJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([]),
          }),
        }),
      };
    },
  },
}));

vi.mock("@/db/schema/reservations", () => ({
  stockReservations: {
    id: "id",
    variantId: "variant_id",
    quantity: "quantity",
    sessionId: "session_id",
    orderId: "order_id",
    status: "status",
    expiresAt: "expires_at",
    convertedAt: "converted_at",
    expiredAt: "expired_at",
  },
}));

vi.mock("@/db/schema/products", () => ({
  productVariants: {
    id: "id",
    stock: "stock",
  },
}));

vi.mock("@/db/schema/orders", () => ({
  orders: {
    id: "id",
    paymentStatus: "payment_status",
  },
}));

describe("reservations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createReservationsInTx", () => {
    it("should skip items without variantId", async () => {
      const { createReservationsInTx } = await import("./reservations");

      const mockTx = {
        update: vi.fn().mockReturnValue({
          set: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              returning: vi.fn().mockResolvedValue([{ id: "v1", stock: 8 }]),
            }),
          }),
        }),
        insert: vi.fn().mockReturnValue({
          values: vi.fn().mockResolvedValue(undefined),
        }),
      };

      await createReservationsInTx(
        mockTx as never,
        [
          { variantId: null, quantity: 1, productName: "No variant" },
          { variantId: "v1", quantity: 2, productName: "With variant" },
        ],
        "session-1",
        "order-1",
        15,
      );

      // Should only call update once (for the item with variantId)
      expect(mockTx.update).toHaveBeenCalledTimes(1);
      expect(mockTx.insert).toHaveBeenCalledTimes(1);
    });

    it("should throw if stock is insufficient", async () => {
      const { createReservationsInTx } = await import("./reservations");

      const mockTx = {
        update: vi.fn().mockReturnValue({
          set: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              returning: vi.fn().mockResolvedValue([]), // No rows = insufficient stock
            }),
          }),
        }),
        insert: vi.fn().mockReturnValue({
          values: vi.fn().mockResolvedValue(undefined),
        }),
      };

      await expect(
        createReservationsInTx(
          mockTx as never,
          [{ variantId: "v1", quantity: 100, productName: "Big order" }],
          "session-1",
          "order-1",
          15,
        ),
      ).rejects.toThrow('Not enough stock for "Big order"');
    });

    it("should set expiresAt based on timeout minutes", async () => {
      const { createReservationsInTx } = await import("./reservations");

      let capturedValues: Record<string, unknown> | null = null;
      const mockTx = {
        update: vi.fn().mockReturnValue({
          set: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              returning: vi.fn().mockResolvedValue([{ id: "v1", stock: 10 }]),
            }),
          }),
        }),
        insert: vi.fn().mockReturnValue({
          values: vi.fn().mockImplementation((v: Record<string, unknown>) => {
            capturedValues = v;
            return Promise.resolve(undefined);
          }),
        }),
      };

      const before = Date.now();
      await createReservationsInTx(
        mockTx as never,
        [{ variantId: "v1", quantity: 1 }],
        "sess",
        "ord",
        30,
      );
      const after = Date.now();

      expect(capturedValues).not.toBeNull();
      const expiresAt = (capturedValues as unknown as Record<string, unknown>)
        .expiresAt as Date;
      // Should be ~30 minutes from now
      expect(expiresAt.getTime()).toBeGreaterThanOrEqual(before + 30 * 60 * 1000 - 1000);
      expect(expiresAt.getTime()).toBeLessThanOrEqual(after + 30 * 60 * 1000 + 1000);
    });
  });

  describe("convertReservations", () => {
    it("should be idempotent (calling twice is safe)", async () => {
      const { convertReservations } = await import("./reservations");

      // Both calls should succeed without error
      await convertReservations("order-1");
      await convertReservations("order-1");

      // update should have been called twice
      expect(mockUpdate).toHaveBeenCalledTimes(2);
    });
  });

  describe("expireReservations", () => {
    it("should be idempotent (calling twice is safe)", async () => {
      const { expireReservations } = await import("./reservations");

      // First call — no RESERVED rows found (mockSelect returns [])
      await expireReservations("order-1");
      // Second call — same
      await expireReservations("order-1");

      // select should be called twice (checking for reserved rows)
      expect(mockSelect).toHaveBeenCalledTimes(2);
      // No updates since no reserved rows found
      expect(mockUpdate).toHaveBeenCalledTimes(0);
    });
  });

  describe("expireStaleReservations", () => {
    it("should return zero counts when no stale reservations", async () => {
      const { expireStaleReservations } = await import("./reservations");

      const result = await expireStaleReservations();

      expect(result).toEqual({ expired: 0, stockRestored: 0 });
    });
  });
});
