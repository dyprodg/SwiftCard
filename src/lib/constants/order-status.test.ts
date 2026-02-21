import { describe, it, expect } from "vitest";
import { isValidStatusTransition, ORDER_STATUS_TRANSITIONS } from "./order-status";

describe("isValidStatusTransition", () => {
  it.each([
    ["PENDING", "CONFIRMED"],
    ["PENDING", "CANCELLED"],
    ["CONFIRMED", "PROCESSING"],
    ["CONFIRMED", "CANCELLED"],
    ["PROCESSING", "SHIPPED"],
    ["PROCESSING", "CANCELLED"],
    ["SHIPPED", "DELIVERED"],
    ["CANCELLED", "REFUNDED"],
  ])("allows %s → %s", (from, to) => {
    expect(isValidStatusTransition(from, to)).toBe(true);
  });

  it.each([
    ["PENDING", "SHIPPED"],
    ["PENDING", "DELIVERED"],
    ["CONFIRMED", "DELIVERED"],
    ["SHIPPED", "CANCELLED"],
    ["DELIVERED", "CANCELLED"],
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

  it("DELIVERED has no outgoing transitions", () => {
    expect(ORDER_STATUS_TRANSITIONS["DELIVERED"]).toEqual([]);
  });

  it("REFUNDED has no outgoing transitions", () => {
    expect(ORDER_STATUS_TRANSITIONS["REFUNDED"]).toEqual([]);
  });
});
