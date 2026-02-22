import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockGet, mockSet, mockDel, mockIncr, mockExpire } = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockSet: vi.fn(),
  mockDel: vi.fn(),
  mockIncr: vi.fn(),
  mockExpire: vi.fn(),
}));

// Mock ioredis before importing kv module to prevent Redis connection
vi.mock("ioredis", () => {
  function MockRedis() {
    return {
      get: mockGet,
      set: mockSet,
      del: mockDel,
      incr: mockIncr,
      expire: mockExpire,
    };
  }
  return { default: MockRedis };
});

import { cartKey, guestCartKey, getCart, setCart, deleteCart, rateLimit } from "./kv";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("cartKey", () => {
  it("returns cart:{userId}", () => {
    expect(cartKey("user-123")).toBe("cart:user-123");
  });

  it("handles different user IDs", () => {
    expect(cartKey("abc")).toBe("cart:abc");
  });
});

describe("guestCartKey", () => {
  it("returns cart:guest:{sessionId}", () => {
    expect(guestCartKey("sess-456")).toBe("cart:guest:sess-456");
  });

  it("handles different session IDs", () => {
    expect(guestCartKey("xyz")).toBe("cart:guest:xyz");
  });
});

describe("getCart", () => {
  it("returns empty array when key not found", async () => {
    mockGet.mockResolvedValue(null);
    const result = await getCart("cart:user-1");
    expect(result).toEqual([]);
  });

  it("parses stored JSON into CartItem array", async () => {
    const items = [
      {
        productId: "p1",
        variantId: null,
        quantity: 2,
        productName: "T",
        variantName: null,
        unitPrice: 1000,
        imageUrl: null,
      },
    ];
    mockGet.mockResolvedValue(JSON.stringify(items));
    const result = await getCart("cart:user-1");
    expect(result).toEqual(items);
  });

  it("returns empty array on invalid JSON", async () => {
    mockGet.mockResolvedValue("not-json{{{");
    const result = await getCart("cart:user-1");
    expect(result).toEqual([]);
  });
});

describe("setCart", () => {
  it("stores items with TTL", async () => {
    const items = [
      {
        productId: "p1",
        variantId: null,
        quantity: 1,
        productName: "T",
        variantName: null,
        unitPrice: 500,
        imageUrl: null,
      },
    ];
    await setCart("cart:user-1", items);
    expect(mockSet).toHaveBeenCalledWith(
      "cart:user-1",
      JSON.stringify(items),
      "EX",
      604800,
    );
  });

  it("deletes key when items array is empty", async () => {
    await setCart("cart:user-1", []);
    expect(mockDel).toHaveBeenCalledWith("cart:user-1");
    expect(mockSet).not.toHaveBeenCalled();
  });
});

describe("deleteCart", () => {
  it("deletes the cart key", async () => {
    await deleteCart("cart:user-1");
    expect(mockDel).toHaveBeenCalledWith("cart:user-1");
  });
});

describe("rateLimit", () => {
  it("returns success when under limit", async () => {
    mockIncr.mockResolvedValue(1);
    const result = await rateLimit("checkout:127.0.0.1", 5, 60);
    expect(result.success).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it("sets expiry on first request", async () => {
    mockIncr.mockResolvedValue(1);
    await rateLimit("checkout:127.0.0.1", 5, 60);
    expect(mockExpire).toHaveBeenCalledWith("ratelimit:checkout:127.0.0.1", 60);
  });

  it("does not reset expiry on subsequent requests", async () => {
    mockIncr.mockResolvedValue(3);
    await rateLimit("checkout:127.0.0.1", 5, 60);
    expect(mockExpire).not.toHaveBeenCalled();
  });

  it("returns failure when at limit", async () => {
    mockIncr.mockResolvedValue(6);
    const result = await rateLimit("checkout:127.0.0.1", 5, 60);
    expect(result.success).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("returns 0 remaining when over limit", async () => {
    mockIncr.mockResolvedValue(10);
    const result = await rateLimit("key", 5, 60);
    expect(result.remaining).toBe(0);
  });
});
