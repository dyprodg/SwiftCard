CREATE TYPE "public"."return_reason" AS ENUM('DEFECTIVE', 'WRONG_ITEM', 'NOT_AS_DESCRIBED', 'CHANGED_MIND', 'TOO_LARGE', 'TOO_SMALL', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."return_status" AS ENUM('REQUESTED', 'APPROVED', 'RECEIVED', 'REFUNDED', 'REJECTED');--> statement-breakpoint
ALTER TYPE "public"."order_event_type" ADD VALUE 'RETURN_REQUESTED';--> statement-breakpoint
ALTER TYPE "public"."order_event_type" ADD VALUE 'RETURN_APPROVED';--> statement-breakpoint
ALTER TYPE "public"."order_event_type" ADD VALUE 'RETURN_RECEIVED';--> statement-breakpoint
ALTER TYPE "public"."order_event_type" ADD VALUE 'RETURN_REFUNDED';--> statement-breakpoint
ALTER TYPE "public"."order_event_type" ADD VALUE 'RETURN_REJECTED';--> statement-breakpoint
CREATE TABLE "return_items" (
	"id" text PRIMARY KEY NOT NULL,
	"return_id" text NOT NULL,
	"order_item_id" text NOT NULL,
	"quantity" integer NOT NULL,
	"reason" "return_reason"
);
--> statement-breakpoint
CREATE TABLE "returns" (
	"id" text PRIMARY KEY NOT NULL,
	"order_id" text NOT NULL,
	"customer_id" text NOT NULL,
	"customer_email" text NOT NULL,
	"status" "return_status" DEFAULT 'REQUESTED' NOT NULL,
	"reason" "return_reason" NOT NULL,
	"note" text,
	"admin_note" text,
	"refund_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"approved_at" timestamp,
	"received_at" timestamp,
	"refunded_at" timestamp,
	"rejected_at" timestamp
);
--> statement-breakpoint
CREATE INDEX "return_items_return_id_idx" ON "return_items" USING btree ("return_id");--> statement-breakpoint
CREATE INDEX "returns_order_id_idx" ON "returns" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "returns_customer_id_idx" ON "returns" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "returns_status_idx" ON "returns" USING btree ("status");--> statement-breakpoint
CREATE INDEX "returns_created_at_idx" ON "returns" USING btree ("created_at");