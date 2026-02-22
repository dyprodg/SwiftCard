import { describe, it, expect } from "vitest";
import {
  isValidStatusTransition,
  ORDER_STATUS_TRANSITIONS,
  AUTOMATED_TRANSITIONS,
} from "./order-status";

describe("isValidStatusTransition", () => {
  it.each([
    ["PENDING", "CONFIRMED"],
    ["PENDING", "CANCELLED"],
    ["CONFIRMED", "PROCESSING"],
    ["CONFIRMED", "CANCELLED"],
    ["CONFIRMED", "REFUNDED"],
    ["PROCESSING", "SHIPPED"],
    ["PROCESSING", "CANCELLED"],
    ["PROCESSING", "REFUNDED"],
    ["SHIPPED", "DELIVERED"],
    ["SHIPPED", "REFUNDED"],
    ["DELIVERED", "REFUNDED"],
    ["CANCELLED", "REFUNDED"],
  ])("allows %s → %s", (from, to) => {
    expect(isValidStatusTransition(from, to)).toBe(true);
  });

  it.each([
    ["PENDING", "SHIPPED"],
    ["PENDING", "DELIVERED"],
    ["CONFIRMED", "DELIVERED"],
    ["SHIPPED", "CANCELLED"],
    ["REFUNDED", "PENDING"],
  ])("disallows %s → %s", (from, to) => {
    expect(isValidStatusTransition(from, to)).toBe(false);
  });

  it("disallows same-status transition", () => {
    expect(isValidStatusTransition("PENDING", "PENDING")).toBe(false);
  });

  it("returns false for unknown status", () => {
    expect(isValidStatusTransition("UNKNOWN", "PENDING")).toBe(false);
  });

  it("REFUNDED has no outgoing transitions", () => {
    expect(ORDER_STATUS_TRANSITIONS["REFUNDED"]).toEqual([]);
  });
});

describe("AUTOMATED_TRANSITIONS", () => {
  it("contains REFUNDED", () => {
    expect(AUTOMATED_TRANSITIONS).toContain("REFUNDED");
  });

  it("REFUNDED is present in transitions but should be filtered from manual dropdown", () => {
    const confirmedTransitions = ORDER_STATUS_TRANSITIONS["CONFIRMED"] ?? [];
    const manualTransitions = confirmedTransitions.filter(
      (s) => !AUTOMATED_TRANSITIONS.includes(s),
    );
    expect(confirmedTransitions).toContain("REFUNDED");
    expect(manualTransitions).not.toContain("REFUNDED");
  });
});
