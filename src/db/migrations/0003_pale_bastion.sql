CREATE TYPE "public"."discount_type" AS ENUM('PERCENTAGE', 'FIXED', 'FREE_SHIPPING');--> statement-breakpoint
CREATE TABLE "discount_categories" (
	"id" text PRIMARY KEY NOT NULL,
	"discount_id" text NOT NULL,
	"category_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "discount_products" (
	"id" text PRIMARY KEY NOT NULL,
	"discount_id" text NOT NULL,
	"product_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "discounts" (
	"id" text PRIMARY KEY NOT NULL,
	"code" text,
	"name" text NOT NULL,
	"description" text,
	"type" "discount_type" NOT NULL,
	"value" integer NOT NULL,
	"min_order_amount" integer,
	"max_uses" integer,
	"used_count" integer DEFAULT 0 NOT NULL,
	"max_uses_per_customer" integer,
	"active" boolean DEFAULT true NOT NULL,
	"automatic" boolean DEFAULT false NOT NULL,
	"starts_at" timestamp,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "discount_id" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "discount_amount" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "discount_code" text;--> statement-breakpoint
CREATE INDEX "discount_categories_discount_id_idx" ON "discount_categories" USING btree ("discount_id");--> statement-breakpoint
CREATE INDEX "discount_categories_category_id_idx" ON "discount_categories" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "discount_products_discount_id_idx" ON "discount_products" USING btree ("discount_id");--> statement-breakpoint
CREATE INDEX "discount_products_product_id_idx" ON "discount_products" USING btree ("product_id");--> statement-breakpoint
CREATE UNIQUE INDEX "discounts_code_idx" ON "discounts" USING btree ("code");--> statement-breakpoint
CREATE INDEX "discounts_active_idx" ON "discounts" USING btree ("active");--> statement-breakpoint
CREATE INDEX "discounts_automatic_idx" ON "discounts" USING btree ("automatic");--> statement-breakpoint
CREATE INDEX "discounts_dates_idx" ON "discounts" USING btree ("starts_at","expires_at");