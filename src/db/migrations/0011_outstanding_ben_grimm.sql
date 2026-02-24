ALTER TYPE "public"."order_status" ADD VALUE 'DRAFT' BEFORE 'PENDING';--> statement-breakpoint
ALTER TYPE "public"."order_event_type" ADD VALUE 'DRAFT_CREATED';--> statement-breakpoint
ALTER TYPE "public"."order_event_type" ADD VALUE 'DRAFT_UPDATED';--> statement-breakpoint
ALTER TYPE "public"."order_event_type" ADD VALUE 'PAYMENT_LINK_SENT';--> statement-breakpoint
ALTER TYPE "public"."order_event_type" ADD VALUE 'PAYMENT_LINK_EXPIRED';--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "is_draft" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "created_by_admin" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "stripe_checkout_session_id" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "payment_link_url" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "payment_link_expires_at" timestamp;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "payment_link_sent_at" timestamp;--> statement-breakpoint
CREATE UNIQUE INDEX "orders_stripe_session_idx" ON "orders" USING btree ("stripe_checkout_session_id");