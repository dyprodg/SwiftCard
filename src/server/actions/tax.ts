"use server";

import { db } from "@/db";
import { taxZones } from "@/db/schema";
import { eq, and, ne } from "drizzle-orm";
import { updateTag } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { taxZoneSchema, type TaxZoneFormValues } from "@/lib/validations/shipping";

async function requireAdmin() {
  const { sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (role !== "admin") throw new Error("Unauthorized");
}

export async function createTaxZone(data: TaxZoneFormValues) {
  await requireAdmin();
  const parsed = taxZoneSchema.parse(data);

  return db.transaction(async (tx) => {
    if (parsed.isDefault) {
      await tx
        .update(taxZones)
        .set({ isDefault: false })
        .where(eq(taxZones.isDefault, true));
    }

    const [zone] = await tx
      .insert(taxZones)
      .values({
        name: parsed.name,
        countries: parsed.countries,
        taxRate: parsed.taxRate,
        taxInclusive: parsed.taxInclusive,
        isDefault: parsed.isDefault,
      })
      .returning();

    updateTag("tax-zones");
    return zone;
  });
}

export async function updateTaxZone(id: string, data: TaxZoneFormValues) {
  await requireAdmin();
  const parsed = taxZoneSchema.parse(data);

  return db.transaction(async (tx) => {
    if (parsed.isDefault) {
      await tx
        .update(taxZones)
        .set({ isDefault: false })
        .where(and(eq(taxZones.isDefault, true), ne(taxZones.id, id)));
    }

    await tx
      .update(taxZones)
      .set({
        name: parsed.name,
        countries: parsed.countries,
        taxRate: parsed.taxRate,
        taxInclusive: parsed.taxInclusive,
        isDefault: parsed.isDefault,
      })
      .where(eq(taxZones.id, id));

    updateTag("tax-zones");
  });
}

export async function deleteTaxZone(id: string) {
  await requireAdmin();
  await db.delete(taxZones).where(eq(taxZones.id, id));
  updateTag("tax-zones");
}

/**
 * Seed default tax zones for Switzerland and Germany.
 * Skips creation if a zone with the same name already exists.
 */
export async function seedDefaultTaxZones() {
  await requireAdmin();

  const existing = await db.query.taxZones.findMany();
  const existingNames = new Set(existing.map((z) => z.name));

  const defaults = [
    {
      name: "Schweiz (MwSt. 8.1%)",
      countries: ["CH", "LI"],
      taxRate: 0.081,
      taxInclusive: true,
      isDefault: true,
    },
    {
      name: "Deutschland (MwSt. 19%)",
      countries: ["DE"],
      taxRate: 0.19,
      taxInclusive: true,
      isDefault: false,
    },
  ];

  let created = 0;
  for (const zone of defaults) {
    if (existingNames.has(zone.name)) continue;

    // If this is the default zone and there's already a default, don't override
    const zoneData = { ...zone };
    if (zoneData.isDefault && existing.some((z) => z.isDefault)) {
      zoneData.isDefault = false;
    }

    await db.insert(taxZones).values(zoneData);
    created++;
  }

  updateTag("tax-zones");
  return { created };
}
