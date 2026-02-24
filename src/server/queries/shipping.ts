"use server";

import { db } from "@/db";
import { shippingZones, shippingRates, taxZones, productVariants } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import {
  filterApplicableRates,
  type ShippingOption,
} from "@/lib/utils/shipping-calculator";

/**
 * Find the shipping zone matching a country code.
 * Falls back to the default zone if no specific match.
 */
export async function getShippingZoneForCountry(country: string) {
  // Try specific country match first
  const zone = await db.query.shippingZones.findFirst({
    where: sql`${country} = ANY(${shippingZones.countries})`,
    with: { rates: true },
  });
  if (zone) return zone;

  // Fall back to default zone
  return db.query.shippingZones.findFirst({
    where: eq(shippingZones.isDefault, true),
    with: { rates: true },
  });
}

/**
 * Get the tax rate for a country.
 * Falls back to default tax zone, then null (use shop settings).
 */
export async function getTaxRateForCountry(country: string): Promise<number | null> {
  const zone = await db.query.taxZones.findFirst({
    where: sql`${country} = ANY(${taxZones.countries})`,
  });
  if (zone) return zone.taxRate;

  const defaultZone = await db.query.taxZones.findFirst({
    where: eq(taxZones.isDefault, true),
  });
  return defaultZone?.taxRate ?? null;
}

/**
 * Calculate total cart weight from variant IDs.
 */
export async function getCartWeight(
  items: { variantId: string | null; quantity: number }[],
): Promise<number> {
  let total = 0;
  for (const item of items) {
    if (item.variantId) {
      const [variant] = await db
        .select({ weight: productVariants.weight })
        .from(productVariants)
        .where(eq(productVariants.id, item.variantId));
      total += (variant?.weight ?? 0) * item.quantity;
    }
  }
  return total;
}

/**
 * Get shipping options for a country + cart.
 * Returns null if no shipping zones are configured (use fallback).
 */
export async function getShippingOptions(
  country: string,
  cartItems: { variantId: string | null; quantity: number }[],
  subtotalCents: number,
): Promise<ShippingOption[] | null> {
  const zone = await getShippingZoneForCountry(country);
  if (!zone || zone.rates.length === 0) return null;

  const cartWeight = await getCartWeight(cartItems);

  return filterApplicableRates(zone.rates, cartWeight, subtotalCents);
}

/**
 * Get all shipping zones with rates (for admin).
 */
export async function getAllShippingZones() {
  return db.query.shippingZones.findMany({
    with: { rates: true },
    orderBy: (z, { asc }) => [asc(z.name)],
  });
}

/**
 * Get a single shipping zone with rates by ID.
 */
export async function getShippingZoneById(id: string) {
  return db.query.shippingZones.findFirst({
    where: eq(shippingZones.id, id),
    with: { rates: true },
  });
}

/**
 * Get all tax zones (for admin).
 */
export async function getAllTaxZones() {
  return db.query.taxZones.findMany({
    orderBy: (z, { asc }) => [asc(z.name)],
  });
}
