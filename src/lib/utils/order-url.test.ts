import { describe, it, expect } from "vitest";
import { buildOrderViewUrl } from "./order-url";

// NEXT_PUBLIC_APP_URL is set in vitest.setup.ts to "https://test.swiftcard.ch"

describe("buildOrderViewUrl", () => {
  it("builds URL with default locale (en)", () => {
    expect(buildOrderViewUrl("order-123", "tok-abc")).toBe(
      "https://test.swiftcard.ch/en/order/order-123?token=tok-abc",
    );
  });

  it("builds URL with explicit locale", () => {
    expect(buildOrderViewUrl("order-456", "tok-xyz", "de")).toBe(
      "https://test.swiftcard.ch/de/order/order-456?token=tok-xyz",
    );
  });

  it("includes the order ID in the path", () => {
    const url = buildOrderViewUrl("my-order", "my-token", "en");
    expect(url).toContain("/order/my-order");
  });

  it("includes the token as query param", () => {
    const url = buildOrderViewUrl("id", "secret-token", "en");
    expect(url).toContain("?token=secret-token");
  });
});
