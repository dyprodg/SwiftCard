CREATE TYPE "public"."bundle_status" AS ENUM('DRAFT', 'ACTIVE', 'ARCHIVED');--> statement-breakpoint
CREATE TABLE "bundle_items" (
	"id" text PRIMARY KEY NOT NULL,
	"bundle_id" text NOT NULL,
	"product_id" text NOT NULL,
	"variant_id" text,
	"quantity" integer DEFAULT 1 NOT NULL,
	"position" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bundle_translations" (
	"id" text PRIMARY KEY NOT NULL,
	"bundle_id" text NOT NULL,
	"locale" text NOT NULL,
	"name" text NOT NULL,
	"description" text
);
--> statement-breakpoint
CREATE TABLE "bundles" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"bundle_price" integer NOT NULL,
	"status" "bundle_status" DEFAULT 'DRAFT' NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "bundle_id" text;--> statement-breakpoint
CREATE INDEX "bundle_items_bundle_id_idx" ON "bundle_items" USING btree ("bundle_id");--> statement-breakpoint
CREATE INDEX "bundle_items_product_id_idx" ON "bundle_items" USING btree ("product_id");--> statement-breakpoint
CREATE UNIQUE INDEX "bundle_translations_bundle_locale_idx" ON "bundle_translations" USING btree ("bundle_id","locale");--> statement-breakpoint
CREATE UNIQUE INDEX "bundles_slug_idx" ON "bundles" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "bundles_status_idx" ON "bundles" USING btree ("status");