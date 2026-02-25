CREATE TYPE "public"."gift_card_status" AS ENUM('ACTIVE', 'DISABLED', 'FULLY_REDEEMED', 'EXPIRED');--> statement-breakpoint
CREATE TYPE "public"."gift_card_transaction_type" AS ENUM('PURCHASE', 'REDEMPTION', 'REFUND', 'ADJUSTMENT', 'EXPIRATION');--> statement-breakpoint
ALTER TYPE "public"."order_event_type" ADD VALUE 'GIFT_CARD_APPLIED';--> statement-breakpoint
ALTER TYPE "public"."order_event_type" ADD VALUE 'GIFT_CARD_ISSUED';--> statement-breakpoint
ALTER TYPE "public"."order_event_type" ADD VALUE 'GIFT_CARD_REFUNDED';--> statement-breakpoint
CREATE TABLE "gift_card_transactions" (
	"id" text PRIMARY KEY NOT NULL,
	"gift_card_id" text NOT NULL,
	"type" "gift_card_transaction_type" NOT NULL,
	"amount" integer NOT NULL,
	"balance_after" integer NOT NULL,
	"order_id" text,
	"note" text,
	"created_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gift_cards" (
	"id" text PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"initial_balance" integer NOT NULL,
	"current_balance" integer NOT NULL,
	"currency" text DEFAULT 'CHF' NOT NULL,
	"status" "gift_card_status" DEFAULT 'ACTIVE' NOT NULL,
	"recipient_email" text,
	"recipient_name" text,
	"sender_name" text,
	"personal_message" text,
	"purchased_by_email" text,
	"purchased_by_user_id" text,
	"source_order_id" text,
	"issued_by_admin" text,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "gift_card_id" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "gift_card_amount" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "gift_card_code" text;--> statement-breakpoint
CREATE INDEX "gift_card_txns_card_id_idx" ON "gift_card_transactions" USING btree ("gift_card_id");--> statement-breakpoint
CREATE INDEX "gift_card_txns_order_id_idx" ON "gift_card_transactions" USING btree ("order_id");--> statement-breakpoint
CREATE UNIQUE INDEX "gift_cards_code_idx" ON "gift_cards" USING btree ("code");--> statement-breakpoint
CREATE INDEX "gift_cards_status_idx" ON "gift_cards" USING btree ("status");--> statement-breakpoint
CREATE INDEX "gift_cards_recipient_email_idx" ON "gift_cards" USING btree ("recipient_email");--> statement-breakpoint
CREATE INDEX "gift_cards_source_order_idx" ON "gift_cards" USING btree ("source_order_id");