CREATE TYPE "public"."carrier" AS ENUM('POST', 'DHL', 'UPS', 'OTHER');--> statement-breakpoint
CREATE TABLE "fulfillment_items" (
	"id" text PRIMARY KEY NOT NULL,
	"fulfillment_id" text NOT NULL,
	"order_item_id" text NOT NULL,
	"quantity" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fulfillments" (
	"id" text PRIMARY KEY NOT NULL,
	"order_id" text NOT NULL,
	"tracking_number" text,
	"carrier" "carrier",
	"carrier_other" text,
	"tracking_url" text,
	"note" text,
	"created_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "fulfillment_items_fulfillment_id_idx" ON "fulfillment_items" USING btree ("fulfillment_id");--> statement-breakpoint
CREATE INDEX "fulfillments_order_id_idx" ON "fulfillments" USING btree ("order_id");