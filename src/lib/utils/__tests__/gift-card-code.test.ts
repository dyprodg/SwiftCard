import { describe, it, expect } from "vitest";
import {
  generateGiftCardCode,
  normalizeGiftCardCode,
  formatGiftCardCode,
  maskGiftCardCode,
} from "../gift-card-code";

describe("generateGiftCardCode", () => {
  it("generates a 16-character code", () => {
    const code = generateGiftCardCode();
    expect(code).toHaveLength(16);
  });

  it("only contains allowed characters (no 0, O, 1, I)", () => {
    for (let i = 0; i < 20; i++) {
      const code = generateGiftCardCode();
      expect(code).not.toMatch(/[0OoIi1l]/);
    }
  });

  it("generates unique codes", () => {
    const codes = new Set<string>();
    for (let i = 0; i < 100; i++) {
      codes.add(generateGiftCardCode());
    }
    expect(codes.size).toBe(100);
  });

  it("generates uppercase alphanumeric codes", () => {
    const code = generateGiftCardCode();
    expect(code).toMatch(/^[A-Z2-9]+$/);
  });
});

describe("normalizeGiftCardCode", () => {
  it("strips dashes and uppercases", () => {
    expect(normalizeGiftCardCode("abcd-efgh-ijkl-mnop")).toBe("ABCDEFGHIJKLMNOP");
  });

  it("strips spaces", () => {
    expect(normalizeGiftCardCode("ABCD EFGH IJKL MNOP")).toBe("ABCDEFGHIJKLMNOP");
  });

  it("handles already clean input", () => {
    expect(normalizeGiftCardCode("ABCDEFGH12345678")).toBe("ABCDEFGH12345678");
  });
});

describe("formatGiftCardCode", () => {
  it("formats in groups of 4 with dashes", () => {
    expect(formatGiftCardCode("ABCDEFGHIJKLMNOP")).toBe("ABCD-EFGH-IJKL-MNOP");
  });

  it("handles already formatted input", () => {
    expect(formatGiftCardCode("ABCD-EFGH-IJKL-MNOP")).toBe("ABCD-EFGH-IJKL-MNOP");
  });
});

describe("maskGiftCardCode", () => {
  it("masks all but last 4 characters", () => {
    expect(maskGiftCardCode("ABCDEFGHIJKLMNOP")).toBe("****-****-****-MNOP");
  });

  it("handles formatted input", () => {
    expect(maskGiftCardCode("ABCD-EFGH-IJKL-MNOP")).toBe("****-****-****-MNOP");
  });

  it("handles short codes gracefully", () => {
    expect(maskGiftCardCode("ABC")).toBe("ABC");
  });
});
