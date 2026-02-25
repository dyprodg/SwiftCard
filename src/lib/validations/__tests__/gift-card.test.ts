import { describe, it, expect } from "vitest";
import {
  createGiftCardSchema,
  updateGiftCardSchema,
  adjustBalanceSchema,
  redeemGiftCardSchema,
  purchaseGiftCardSchema,
} from "../gift-card";

describe("createGiftCardSchema", () => {
  it("accepts valid input", () => {
    const result = createGiftCardSchema.safeParse({
      initialBalance: 5000,
      recipientEmail: "test@example.com",
    });
    expect(result.success).toBe(true);
  });

  it("rejects balance below minimum (100 cents = CHF 1)", () => {
    const result = createGiftCardSchema.safeParse({
      initialBalance: 50,
    });
    expect(result.success).toBe(false);
  });

  it("accepts without optional fields", () => {
    const result = createGiftCardSchema.safeParse({
      initialBalance: 2500,
    });
    expect(result.success).toBe(true);
  });

  it("accepts full input with all optional fields", () => {
    const result = createGiftCardSchema.safeParse({
      initialBalance: 10000,
      recipientEmail: "gift@example.com",
      recipientName: "John",
      senderName: "Jane",
      personalMessage: "Happy birthday!",
      expiresAt: "2027-12-31T00:00:00.000Z",
      note: "VIP customer gift",
    });
    expect(result.success).toBe(true);
  });
});

describe("updateGiftCardSchema", () => {
  it("requires id", () => {
    const result = updateGiftCardSchema.safeParse({ status: "ACTIVE" });
    expect(result.success).toBe(false);
  });

  it("accepts status update", () => {
    const result = updateGiftCardSchema.safeParse({
      id: "gc-1",
      status: "DISABLED",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid status", () => {
    const result = updateGiftCardSchema.safeParse({
      id: "gc-1",
      status: "FULLY_REDEEMED",
    });
    expect(result.success).toBe(false);
  });
});

describe("adjustBalanceSchema", () => {
  it("accepts positive adjustment with note", () => {
    const result = adjustBalanceSchema.safeParse({
      giftCardId: "gc-1",
      amount: 1000,
      note: "Top-up",
    });
    expect(result.success).toBe(true);
  });

  it("accepts negative adjustment", () => {
    const result = adjustBalanceSchema.safeParse({
      giftCardId: "gc-1",
      amount: -500,
      note: "Manual deduction",
    });
    expect(result.success).toBe(true);
  });

  it("rejects zero amount", () => {
    const result = adjustBalanceSchema.safeParse({
      giftCardId: "gc-1",
      amount: 0,
      note: "Nothing",
    });
    expect(result.success).toBe(false);
  });

  it("requires note", () => {
    const result = adjustBalanceSchema.safeParse({
      giftCardId: "gc-1",
      amount: 1000,
      note: "",
    });
    expect(result.success).toBe(false);
  });
});

describe("redeemGiftCardSchema", () => {
  it("normalizes code: strips dashes and uppercases", () => {
    const result = redeemGiftCardSchema.safeParse({
      code: "abcd-efgh-1234-5678",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.code).toBe("ABCDEFGH12345678");
    }
  });

  it("rejects empty code", () => {
    const result = redeemGiftCardSchema.safeParse({ code: "" });
    expect(result.success).toBe(false);
  });
});

describe("purchaseGiftCardSchema", () => {
  it("accepts valid purchase", () => {
    const result = purchaseGiftCardSchema.safeParse({
      amount: 5000,
      recipientEmail: "friend@example.com",
      recipientName: "Friend",
      senderName: "Me",
    });
    expect(result.success).toBe(true);
  });

  it("rejects amount below minimum (500 cents = CHF 5)", () => {
    const result = purchaseGiftCardSchema.safeParse({
      amount: 100,
      recipientEmail: "friend@example.com",
      recipientName: "Friend",
      senderName: "Me",
    });
    expect(result.success).toBe(false);
  });

  it("rejects amount above maximum (50000 cents = CHF 500)", () => {
    const result = purchaseGiftCardSchema.safeParse({
      amount: 100000,
      recipientEmail: "friend@example.com",
      recipientName: "Friend",
      senderName: "Me",
    });
    expect(result.success).toBe(false);
  });

  it("requires recipient email", () => {
    const result = purchaseGiftCardSchema.safeParse({
      amount: 5000,
      recipientName: "Friend",
      senderName: "Me",
    });
    expect(result.success).toBe(false);
  });

  it("requires valid email", () => {
    const result = purchaseGiftCardSchema.safeParse({
      amount: 5000,
      recipientEmail: "not-an-email",
      recipientName: "Friend",
      senderName: "Me",
    });
    expect(result.success).toBe(false);
  });
});
