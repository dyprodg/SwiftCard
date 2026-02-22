import { createClient } from "@vercel/edge-config";
import { cacheTag, cacheLife } from "next/cache";

export type EdgeShopSettings = {
  shopName: string;
  shopDescription: string | null;
  contactEmail: string;
  currency: string;
  defaultTaxRate: number;
  defaultShippingCost: number;
  freeShippingThreshold: number | null;
  allowGuestCheckout: boolean;
};

const DEFAULTS: EdgeShopSettings = {
  shopName: "SwiftCard",
  shopDescription: null,
  contactEmail: "info@swiftcard.ch",
  currency: "CHF",
  defaultTaxRate: 0.081,
  defaultShippingCost: 990,
  freeShippingThreshold: 10000,
  allowGuestCheckout: true,
};

function getClient() {
  const connectionString = process.env.EDGE_CONFIG;
  if (!connectionString) return null;
  return createClient(connectionString);
}

export async function getShopSettings(): Promise<EdgeShopSettings> {
  "use cache";
  cacheTag("shop-settings");
  cacheLife("days");

  try {
    const client = getClient();
    if (!client) return DEFAULTS;
    const settings = await client.get<EdgeShopSettings>("shopSettings");
    return settings ?? DEFAULTS;
  } catch {
    return DEFAULTS;
  }
}

export async function isMaintenanceMode(): Promise<boolean> {
  try {
    const client = getClient();
    if (!client) return false;
    const value = await client.get<boolean>("maintenanceMode");
    return value ?? false;
  } catch {
    return false;
  }
}

export async function getFeatureFlag(flag: string): Promise<boolean> {
  try {
    const client = getClient();
    if (!client) return false;
    const value = await client.get<boolean>(flag);
    return value ?? false;
  } catch {
    return false;
  }
}
