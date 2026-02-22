import { pgTable, text, integer, real, boolean, timestamp } from "drizzle-orm/pg-core";

export const shopSettings = pgTable("shop_settings", {
  id: text("id").primaryKey().default("singleton"),
  shopName: text("shop_name").notNull(),
  shopDescription: text("shop_description"),
  contactEmail: text("contact_email").notNull(),
  termsUrl: text("terms_url"),
  privacyUrl: text("privacy_url"),
  imprintUrl: text("imprint_url"),
  freeShippingThreshold: integer("free_shipping_threshold"),
  defaultShippingCost: integer("default_shipping_cost").notNull(),
  defaultTaxRate: real("default_tax_rate").default(0.081).notNull(),
  currency: text("currency").default("CHF").notNull(),
  allowGuestCheckout: boolean("allow_guest_checkout").default(true).notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});
