CREATE TYPE "public"."refund_reason" AS ENUM('DAMAGED', 'MISSING_ITEM', 'CUSTOMER_REQUEST', 'DUPLICATE', 'OTHER');--> statement-breakpoint
ALTER TYPE "public"."payment_status" ADD VALUE 'PARTIALLY_REFUNDED';--> statement-breakpoint
CREATE TABLE "order_refund_items" (
	"id" text PRIMARY KEY NOT NULL,
	"refund_id" text NOT NULL,
	"order_item_id" text NOT NULL,
	"quantity" integer NOT NULL,
	"amount" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_refunds" (
	"id" text PRIMARY KEY NOT NULL,
	"order_id" text NOT NULL,
	"stripe_refund_id" text NOT NULL,
	"amount" integer NOT NULL,
	"currency" text DEFAULT 'CHF' NOT NULL,
	"reason" "refund_reason" NOT NULL,
	"note" text,
	"is_full_refund" boolean DEFAULT false NOT NULL,
	"stock_restored" boolean DEFAULT false NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "total_refunded" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE INDEX "order_refund_items_refund_id_idx" ON "order_refund_items" USING btree ("refund_id");--> statement-breakpoint
CREATE UNIQUE INDEX "order_refunds_stripe_id_idx" ON "order_refunds" USING btree ("stripe_refund_id");--> statement-breakpoint
CREATE INDEX "order_refunds_order_id_idx" ON "order_refunds" USING btree ("order_id");