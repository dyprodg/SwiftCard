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

export type EventBanner = {
  enabled: boolean;
  textEn: string;
  textDe: string;
  linkUrl?: string;
  linkTextEn?: string;
  linkTextDe?: string;
  bgColor?: string;
};

export async function getEventBanner(): Promise<EventBanner | null> {
  "use cache";
  cacheTag("event-banner");
  cacheLife("hours");

  try {
    const client = getClient();
    if (!client) return null;
    const banner = await client.get<EventBanner>("eventBanner");
    if (!banner || !banner.enabled) return null;
    return banner;
  } catch {
    return null;
  }
}

export type ReservationSettings = {
  timeoutMinutes: number;
};

const RESERVATION_DEFAULTS: ReservationSettings = {
  timeoutMinutes: 15,
};

export async function getReservationSettings(): Promise<ReservationSettings> {
  "use cache";
  cacheTag("reservation-settings");
  cacheLife("hours");

  try {
    const client = getClient();
    if (!client) return RESERVATION_DEFAULTS;
    const settings = await client.get<ReservationSettings>("reservationSettings");
    return settings ?? RESERVATION_DEFAULTS;
  } catch {
    return RESERVATION_DEFAULTS;
  }
}

export type ReturnSettings = {
  returnWindowDays: number;
  enabled: boolean;
};

const RETURN_DEFAULTS: ReturnSettings = {
  returnWindowDays: 30,
  enabled: true,
};

export async function getReturnSettings(): Promise<ReturnSettings> {
  "use cache";
  cacheTag("return-settings");
  cacheLife("hours");

  try {
    const client = getClient();
    if (!client) return RETURN_DEFAULTS;
    const settings = await client.get<ReturnSettings>("returnSettings");
    return settings ?? RETURN_DEFAULTS;
  } catch {
    return RETURN_DEFAULTS;
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
