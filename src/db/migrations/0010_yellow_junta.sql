CREATE TYPE "public"."shipping_rate_type" AS ENUM('FLAT', 'WEIGHT_BASED', 'PRICE_BASED');--> statement-breakpoint
CREATE TABLE "shipping_rates" (
	"id" text PRIMARY KEY NOT NULL,
	"zone_id" text NOT NULL,
	"name" text NOT NULL,
	"type" "shipping_rate_type" NOT NULL,
	"min_value" integer,
	"max_value" integer,
	"price" integer NOT NULL,
	"free_above" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shipping_zones" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"countries" text[] NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tax_zones" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"countries" text[] NOT NULL,
	"tax_rate" real NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "product_variants" ADD COLUMN "weight" integer;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "shipping_method" text;--> statement-breakpoint
CREATE INDEX "shipping_rates_zone_id_idx" ON "shipping_rates" USING btree ("zone_id");