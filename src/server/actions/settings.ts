"use server";

import { db } from "@/db";
import { shopSettings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath, updateTag } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { updateEdgeConfig } from "@/lib/edge-config-write";
import type { EdgeShopSettings } from "@/lib/edge-config";
import {
  generalSettingsSchema,
  shippingSettingsSchema,
  paymentSettingsSchema,
  legalSettingsSchema,
  type GeneralSettingsInput,
  type ShippingSettingsInput,
  type PaymentSettingsInput,
  type LegalSettingsInput,
} from "@/lib/validations/settings";

async function requireAdmin() {
  const { userId, sessionClaims } = await auth();
  if (!userId) throw new Error("Unauthorized");
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (role !== "admin") throw new Error("Unauthorized");
  return userId;
}

async function upsertSettings(data: Partial<typeof shopSettings.$inferInsert>) {
  const [existing] = await db.select().from(shopSettings).limit(1);

  if (existing) {
    const [updated] = await db
      .update(shopSettings)
      .set(data)
      .where(eq(shopSettings.id, "singleton"))
      .returning();
    return updated;
  }

  const [created] = await db
    .insert(shopSettings)
    .values({
      id: "singleton",
      shopName: "SwiftCard",
      contactEmail: "info@swiftcard.ch",
      defaultShippingCost: 990,
      ...data,
    })
    .returning();
  return created;
}

async function syncSettingsToEdgeConfig() {
  const [settings] = await db.select().from(shopSettings).limit(1);
  if (!settings) return;

  const edgeSettings: EdgeShopSettings = {
    shopName: settings.shopName,
    shopDescription: settings.shopDescription,
    contactEmail: settings.contactEmail,
    currency: settings.currency,
    defaultTaxRate: settings.defaultTaxRate,
    defaultShippingCost: settings.defaultShippingCost,
    freeShippingThreshold: settings.freeShippingThreshold,
    allowGuestCheckout: settings.allowGuestCheckout,
  };

  await updateEdgeConfig([{ key: "shopSettings", value: edgeSettings }]);
}

export async function updateGeneralSettings(input: GeneralSettingsInput) {
  await requireAdmin();
  const data = generalSettingsSchema.parse(input);

  const result = await upsertSettings({
    shopName: data.shopName,
    shopDescription: data.shopDescription ?? null,
    contactEmail: data.contactEmail,
    allowGuestCheckout: data.allowGuestCheckout,
  });

  await syncSettingsToEdgeConfig().catch((e) =>
    console.error("Edge Config sync failed:", e),
  );

  updateTag("shop-settings");
  revalidatePath("/", "layout");
  return result;
}

export async function updateShippingSettings(input: ShippingSettingsInput) {
  await requireAdmin();
  const data = shippingSettingsSchema.parse(input);

  const result = await upsertSettings({
    defaultShippingCost: data.defaultShippingCost,
    freeShippingThreshold: data.freeShippingThreshold,
  });

  await syncSettingsToEdgeConfig().catch((e) =>
    console.error("Edge Config sync failed:", e),
  );

  updateTag("shop-settings");
  revalidatePath("/", "layout");
  return result;
}

export async function updatePaymentSettings(input: PaymentSettingsInput) {
  await requireAdmin();
  const data = paymentSettingsSchema.parse(input);

  const result = await upsertSettings({
    currency: data.currency,
    defaultTaxRate: data.defaultTaxRate,
  });

  await syncSettingsToEdgeConfig().catch((e) =>
    console.error("Edge Config sync failed:", e),
  );

  updateTag("shop-settings");
  revalidatePath("/", "layout");
  return result;
}

export async function updateLegalSettings(input: LegalSettingsInput) {
  await requireAdmin();
  const data = legalSettingsSchema.parse(input);

  const result = await upsertSettings({
    termsUrl: data.termsUrl || null,
    privacyUrl: data.privacyUrl || null,
    imprintUrl: data.imprintUrl || null,
  });

  updateTag("shop-settings");
  revalidatePath("/", "layout");
  return result;
}

export async function updateMaintenanceMode(enabled: boolean) {
  await requireAdmin();
  await updateEdgeConfig([{ key: "maintenanceMode", value: enabled }]);
  revalidatePath("/", "layout");
}

export async function updateEventBanner(input: {
  enabled: boolean;
  textEn: string;
  textDe: string;
  linkUrl?: string;
  linkTextEn?: string;
  linkTextDe?: string;
  bgColor?: string;
}) {
  await requireAdmin();

  await updateEdgeConfig([
    {
      key: "eventBanner",
      value: {
        enabled: input.enabled,
        textEn: input.textEn,
        textDe: input.textDe,
        linkUrl: input.linkUrl || undefined,
        linkTextEn: input.linkTextEn || undefined,
        linkTextDe: input.linkTextDe || undefined,
        bgColor: input.bgColor || "bg-primary",
      },
    },
  ]);

  updateTag("event-banner");
  revalidatePath("/", "layout");
}
