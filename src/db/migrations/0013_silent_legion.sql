ALTER TABLE "orders" ADD COLUMN "tax_inclusive" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "tax_zones" ADD COLUMN "tax_inclusive" boolean DEFAULT true NOT NULL;