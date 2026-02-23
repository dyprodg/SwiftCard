CREATE TYPE "public"."reservation_status" AS ENUM('RESERVED', 'CONVERTED', 'EXPIRED');--> statement-breakpoint
CREATE TABLE "stock_reservations" (
	"id" text PRIMARY KEY NOT NULL,
	"variant_id" text NOT NULL,
	"quantity" integer NOT NULL,
	"session_id" text NOT NULL,
	"order_id" text,
	"status" "reservation_status" DEFAULT 'RESERVED' NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"converted_at" timestamp,
	"expired_at" timestamp
);
--> statement-breakpoint
CREATE INDEX "stock_reservations_variant_id_idx" ON "stock_reservations" USING btree ("variant_id");--> statement-breakpoint
CREATE INDEX "stock_reservations_session_id_idx" ON "stock_reservations" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "stock_reservations_order_id_idx" ON "stock_reservations" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "stock_reservations_status_idx" ON "stock_reservations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "stock_reservations_expires_at_idx" ON "stock_reservations" USING btree ("expires_at");