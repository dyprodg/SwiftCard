import { db } from "@/db";
import { shopSettings } from "@/db/schema";

export async function getShopSettingsFromDb() {
  const [settings] = await db.select().from(shopSettings).limit(1);
  return settings ?? null;
}
