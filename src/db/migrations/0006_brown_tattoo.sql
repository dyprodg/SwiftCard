CREATE TYPE "public"."order_event_type" AS ENUM('ORDER_CREATED', 'STATUS_CHANGED', 'PAYMENT_STATUS_CHANGED', 'FULFILLMENT_CREATED', 'FULFILLMENT_STATUS_CHANGED', 'REFUND_CREATED', 'SHIPPING_ADDRESS_EDITED', 'CUSTOMER_NOTE_EDITED', 'INTERNAL_NOTE_ADDED');--> statement-breakpoint
CREATE TABLE "order_events" (
	"id" text PRIMARY KEY NOT NULL,
	"order_id" text NOT NULL,
	"type" "order_event_type" NOT NULL,
	"data" jsonb,
	"created_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "order_events_order_id_idx" ON "order_events" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "order_events_created_at_idx" ON "order_events" USING btree ("created_at");