"use server";

import { db } from "@/db";
import { shippingZones, shippingRates } from "@/db/schema";
import { eq, and, ne, inArray } from "drizzle-orm";
import { updateTag } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import {
  shippingZoneSchema,
  type ShippingZoneFormValues,
} from "@/lib/validations/shipping";

async function requireAdmin() {
  const { sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (role !== "admin") throw new Error("Unauthorized");
}

export async function createShippingZone(data: ShippingZoneFormValues) {
  await requireAdmin();
  const parsed = shippingZoneSchema.parse(data);

  return db.transaction(async (tx) => {
    // If this zone is default, unset other defaults
    if (parsed.isDefault) {
      await tx
        .update(shippingZones)
        .set({ isDefault: false })
        .where(eq(shippingZones.isDefault, true));
    }

    const [zone] = await tx
      .insert(shippingZones)
      .values({
        name: parsed.name,
        countries: parsed.countries,
        isDefault: parsed.isDefault,
      })
      .returning();

    // Insert rates
    if (parsed.rates.length > 0) {
      await tx.insert(shippingRates).values(
        parsed.rates.map((rate) => ({
          zoneId: zone.id,
          name: rate.name,
          type: rate.type,
          price: rate.price,
          minValue: rate.minValue,
          maxValue: rate.maxValue,
          freeAbove: rate.freeAbove,
        })),
      );
    }

    updateTag("shipping-zones");
    return zone;
  });
}

export async function updateShippingZone(id: string, data: ShippingZoneFormValues) {
  await requireAdmin();
  const parsed = shippingZoneSchema.parse(data);

  return db.transaction(async (tx) => {
    // If this zone is default, unset other defaults
    if (parsed.isDefault) {
      await tx
        .update(shippingZones)
        .set({ isDefault: false })
        .where(and(eq(shippingZones.isDefault, true), ne(shippingZones.id, id)));
    }

    await tx
      .update(shippingZones)
      .set({
        name: parsed.name,
        countries: parsed.countries,
        isDefault: parsed.isDefault,
      })
      .where(eq(shippingZones.id, id));

    // Manage rates: delete removed, keep existing, add new
    const existingRates = await tx
      .select()
      .from(shippingRates)
      .where(eq(shippingRates.zoneId, id));

    const existingIds = new Set(existingRates.map((r) => r.id));
    const keptIds = new Set(parsed.rates.filter((r) => r.id).map((r) => r.id!));

    // Delete removed rates
    const toDelete = [...existingIds].filter((eid) => !keptIds.has(eid));
    if (toDelete.length > 0) {
      await tx.delete(shippingRates).where(inArray(shippingRates.id, toDelete));
    }

    // Update existing rates
    for (const rate of parsed.rates.filter((r) => r.id && existingIds.has(r.id!))) {
      await tx
        .update(shippingRates)
        .set({
          name: rate.name,
          type: rate.type,
          price: rate.price,
          minValue: rate.minValue,
          maxValue: rate.maxValue,
          freeAbove: rate.freeAbove,
        })
        .where(eq(shippingRates.id, rate.id!));
    }

    // Insert new rates (no id)
    const newRates = parsed.rates.filter((r) => !r.id);
    if (newRates.length > 0) {
      await tx.insert(shippingRates).values(
        newRates.map((rate) => ({
          zoneId: id,
          name: rate.name,
          type: rate.type,
          price: rate.price,
          minValue: rate.minValue,
          maxValue: rate.maxValue,
          freeAbove: rate.freeAbove,
        })),
      );
    }

    updateTag("shipping-zones");
  });
}

export async function deleteShippingZone(id: string) {
  await requireAdmin();

  await db.transaction(async (tx) => {
    await tx.delete(shippingRates).where(eq(shippingRates.zoneId, id));
    await tx.delete(shippingZones).where(eq(shippingZones.id, id));
  });

  updateTag("shipping-zones");
}

/**
 * Seed default shipping zones for Switzerland and Germany.
 * Skips creation if a zone with the same name already exists.
 */
export async function seedDefaultShippingZones() {
  await requireAdmin();

  const existing = await db.query.shippingZones.findMany();
  const existingNames = new Set(existing.map((z) => z.name));

  const defaults: {
    name: string;
    countries: string[];
    isDefault: boolean;
    rates: { name: string; type: "FLAT"; price: number; freeAbove: number | null }[];
  }[] = [
    {
      name: "Schweiz",
      countries: ["CH", "LI"],
      isDefault: true,
      rates: [
        { name: "Standardversand", type: "FLAT", price: 790, freeAbove: 5000 },
        { name: "Expressversand", type: "FLAT", price: 1490, freeAbove: null },
      ],
    },
    {
      name: "Deutschland",
      countries: ["DE"],
      isDefault: false,
      rates: [
        { name: "Standardversand", type: "FLAT", price: 990, freeAbove: 7500 },
        { name: "Expressversand", type: "FLAT", price: 1990, freeAbove: null },
      ],
    },
  ];

  let created = 0;
  for (const zone of defaults) {
    if (existingNames.has(zone.name)) continue;

    const zoneData = {
      name: zone.name,
      countries: zone.countries,
      isDefault: zone.isDefault && !existing.some((z) => z.isDefault),
    };

    await db.transaction(async (tx) => {
      const [newZone] = await tx.insert(shippingZones).values(zoneData).returning();
      if (zone.rates.length > 0) {
        await tx.insert(shippingRates).values(
          zone.rates.map((rate) => ({
            zoneId: newZone.id,
            name: rate.name,
            type: rate.type,
            price: rate.price,
            freeAbove: rate.freeAbove,
          })),
        );
      }
    });
    created++;
  }

  updateTag("shipping-zones");
  return { created };
}
