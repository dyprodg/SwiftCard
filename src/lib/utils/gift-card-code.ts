import { randomBytes } from "crypto";

const CHARSET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I to avoid confusion

/**
 * Generate a 16-character alphanumeric gift card code.
 * Format: XXXX-XXXX-XXXX-XXXX (stored without dashes)
 */
export function generateGiftCardCode(): string {
  const bytes = randomBytes(16);
  let code = "";
  for (let i = 0; i < 16; i++) {
    code += CHARSET[bytes[i] % CHARSET.length];
  }
  return code;
}

/**
 * Normalize a gift card code: strip dashes/spaces, uppercase.
 */
export function normalizeGiftCardCode(input: string): string {
  return input.replace(/[-\s]/g, "").toUpperCase();
}

/**
 * Format a gift card code for display: XXXX-XXXX-XXXX-XXXX.
 */
export function formatGiftCardCode(code: string): string {
  const clean = normalizeGiftCardCode(code);
  return clean.replace(/(.{4})(?=.)/g, "$1-");
}

/**
 * Mask a gift card code for lists: ****-****-****-XXXX.
 */
export function maskGiftCardCode(code: string): string {
  const clean = normalizeGiftCardCode(code);
  if (clean.length < 4) return clean;
  const last4 = clean.slice(-4);
  return `****-****-****-${last4}`;
}
