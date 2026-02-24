import { describe, it, expect } from "vitest";
import { addressSchema, addressFormSchema } from "./address";

describe("addressSchema", () => {
  const validAddress = {
    label: "Home",
    name: "John Doe",
    phone: "+41 79 123 45 67",
    company: "Acme Inc.",
    address1: "Bahnhofstrasse 1",
    address2: "Apt 3",
    city: "Zürich",
    zip: "8001",
    country: "CH",
    isDefault: true,
  };

  it("accepts a valid address", () => {
    const result = addressSchema.safeParse(validAddress);
    expect(result.success).toBe(true);
  });

  it("accepts minimal address (no optional fields)", () => {
    const result = addressSchema.safeParse({
      label: "Work",
      name: "Jane Smith",
      address1: "Marktgasse 10",
      city: "Bern",
      zip: "3001",
      country: "CH",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty label", () => {
    const result = addressSchema.safeParse({ ...validAddress, label: "" });
    expect(result.success).toBe(false);
  });

  it("rejects short name", () => {
    const result = addressSchema.safeParse({ ...validAddress, name: "J" });
    expect(result.success).toBe(false);
  });

  it("rejects short address1", () => {
    const result = addressSchema.safeParse({ ...validAddress, address1: "AB" });
    expect(result.success).toBe(false);
  });

  it("rejects empty city", () => {
    const result = addressSchema.safeParse({ ...validAddress, city: "" });
    expect(result.success).toBe(false);
  });

  it("rejects short zip", () => {
    const result = addressSchema.safeParse({ ...validAddress, zip: "12" });
    expect(result.success).toBe(false);
  });

  it("rejects short country code", () => {
    const result = addressSchema.safeParse({ ...validAddress, country: "C" });
    expect(result.success).toBe(false);
  });

  it("defaults isDefault to false", () => {
    const result = addressSchema.safeParse({
      label: "Home",
      name: "John Doe",
      address1: "Bahnhofstrasse 1",
      city: "Zürich",
      zip: "8001",
      country: "CH",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isDefault).toBe(false);
    }
  });

  it("trims whitespace from fields", () => {
    const result = addressSchema.safeParse({
      ...validAddress,
      label: "  Home  ",
      name: "  John Doe  ",
      city: "  Zürich  ",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.label).toBe("Home");
      expect(result.data.name).toBe("John Doe");
      expect(result.data.city).toBe("Zürich");
    }
  });
});

describe("addressFormSchema", () => {
  it("accepts valid form data", () => {
    const result = addressFormSchema.safeParse({
      label: "Home",
      name: "John Doe",
      address1: "Bahnhofstrasse 1",
      city: "Zürich",
      zip: "8001",
      country: "CH",
    });
    expect(result.success).toBe(true);
  });

  it("phone is optional", () => {
    const result = addressFormSchema.safeParse({
      label: "Home",
      name: "John Doe",
      address1: "Bahnhofstrasse 1",
      city: "Zürich",
      zip: "8001",
      country: "CH",
      phone: undefined,
    });
    expect(result.success).toBe(true);
  });
});
