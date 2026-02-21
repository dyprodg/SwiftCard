import { describe, it, expect, vi } from "vitest";

// Mock ioredis before importing kv module to prevent Redis connection
vi.mock("ioredis", () => {
  const MockRedis = vi.fn();
  MockRedis.prototype = {};
  return { default: MockRedis };
});

import { cartKey, guestCartKey } from "./kv";

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
