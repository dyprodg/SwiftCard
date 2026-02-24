import { describe, it, expect } from "vitest";
import { toggleWishlistSchema } from "./wishlist";

describe("toggleWishlistSchema", () => {
  it("accepts valid product ID", () => {
    const result = toggleWishlistSchema.parse({ productId: "prod-123" });
    expect(result.productId).toBe("prod-123");
  });

  it("rejects empty product ID", () => {
    const result = toggleWishlistSchema.safeParse({ productId: "" });
    expect(result.success).toBe(false);
  });

  it("rejects missing product ID", () => {
    const result = toggleWishlistSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});
