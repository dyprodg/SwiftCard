import { describe, it, expect } from "vitest";
import { buildTrackingUrl, CARRIER_LABELS, CARRIER_VALUES } from "./carriers";

describe("CARRIER_VALUES", () => {
  it("contains all expected carriers", () => {
    expect(CARRIER_VALUES).toEqual(["POST", "DHL", "UPS", "OTHER"]);
  });

  it("has labels for all carriers", () => {
    for (const carrier of CARRIER_VALUES) {
      expect(CARRIER_LABELS[carrier]).toBeDefined();
    }
  });
});

describe("buildTrackingUrl", () => {
  it("builds Swiss Post URL", () => {
    const url = buildTrackingUrl("POST", "99.12.345678.12345678");
    expect(url).toContain("service.post.ch");
    expect(url).toContain("99.12.345678.12345678");
  });

  it("builds DHL URL", () => {
    const url = buildTrackingUrl("DHL", "1234567890");
    expect(url).toContain("dhl.com");
    expect(url).toContain("1234567890");
  });

  it("builds UPS URL", () => {
    const url = buildTrackingUrl("UPS", "1Z999AA10123456784");
    expect(url).toContain("ups.com");
    expect(url).toContain("1Z999AA10123456784");
  });

  it("returns null for OTHER carrier", () => {
    const url = buildTrackingUrl("OTHER", "ABC123");
    expect(url).toBeNull();
  });

  it("returns null when carrier is null", () => {
    expect(buildTrackingUrl(null, "ABC123")).toBeNull();
  });

  it("returns null when trackingNumber is null", () => {
    expect(buildTrackingUrl("POST", null)).toBeNull();
  });

  it("returns null when both are null", () => {
    expect(buildTrackingUrl(null, null)).toBeNull();
  });

  it("encodes special characters in tracking number", () => {
    const url = buildTrackingUrl("POST", "123 456&789");
    expect(url).toContain("123%20456%26789");
  });
});
