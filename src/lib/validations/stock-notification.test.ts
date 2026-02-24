import { describe, it, expect } from "vitest";
import { stockNotificationSchema } from "./stock-notification";

describe("stockNotificationSchema", () => {
  const valid = {
    email: "user@example.com",
    variantId: "var-123",
    productId: "prod-123",
  };

  it("accepts valid input", () => {
    const result = stockNotificationSchema.parse(valid);
    expect(result.email).toBe("user@example.com");
  });

  it("rejects invalid email", () => {
    const result = stockNotificationSchema.safeParse({ ...valid, email: "not-email" });
    expect(result.success).toBe(false);
  });

  it("rejects empty email", () => {
    const result = stockNotificationSchema.safeParse({ ...valid, email: "" });
    expect(result.success).toBe(false);
  });

  it("rejects missing variant ID", () => {
    const result = stockNotificationSchema.safeParse({
      email: "a@b.com",
      productId: "p1",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing product ID", () => {
    const result = stockNotificationSchema.safeParse({
      email: "a@b.com",
      variantId: "v1",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty variant ID", () => {
    const result = stockNotificationSchema.safeParse({ ...valid, variantId: "" });
    expect(result.success).toBe(false);
  });
});
