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
