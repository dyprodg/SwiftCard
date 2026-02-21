import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { generateOrderNumber } from "./order-number";

describe("generateOrderNumber", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("produces SC-YYYYMMDD-XXXX format", () => {
    vi.setSystemTime(new Date("2026-02-21T12:00:00Z"));
    expect(generateOrderNumber(1)).toBe("SC-20260221-0001");
  });

  it("pads sequence number to 4 digits", () => {
    vi.setSystemTime(new Date("2026-01-05T00:00:00Z"));
    expect(generateOrderNumber(42)).toBe("SC-20260105-0042");
  });

  it("handles sequence > 9999", () => {
    vi.setSystemTime(new Date(2026, 11, 31, 12, 0, 0));
    expect(generateOrderNumber(12345)).toBe("SC-20261231-12345");
  });

  it("pads single-digit month and day", () => {
    vi.setSystemTime(new Date("2026-03-09T00:00:00Z"));
    expect(generateOrderNumber(7)).toBe("SC-20260309-0007");
  });

  it("handles sequence 0", () => {
    vi.setSystemTime(new Date("2026-06-15T00:00:00Z"));
    expect(generateOrderNumber(0)).toBe("SC-20260615-0000");
  });
});
