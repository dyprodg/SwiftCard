CREATE TYPE "public"."subscription_interval" AS ENUM('WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY');--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('ACTIVE', 'PAUSED', 'PAST_DUE', 'CANCELLED', 'EXPIRED');--> statement-breakpoint
ALTER TYPE "public"."order_event_type" ADD VALUE 'SUBSCRIPTION_CREATED';--> statement-breakpoint
ALTER TYPE "public"."order_event_type" ADD VALUE 'SUBSCRIPTION_RENEWED';--> statement-breakpoint
ALTER TYPE "public"."order_event_type" ADD VALUE 'SUBSCRIPTION_CANCELLED';--> statement-breakpoint
ALTER TYPE "public"."order_event_type" ADD VALUE 'SUBSCRIPTION_PAUSED';--> statement-breakpoint
CREATE TABLE "subscription_plans" (
	"id" text PRIMARY KEY NOT NULL,
	"product_id" text NOT NULL,
	"variant_id" text,
	"name" text NOT NULL,
	"interval" "subscription_interval" NOT NULL,
	"discount_percent" integer DEFAULT 0 NOT NULL,
	"stripe_price_id" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" text PRIMARY KEY NOT NULL,
	"plan_id" text NOT NULL,
	"customer_id" text NOT NULL,
	"customer_email" text NOT NULL,
	"stripe_subscription_id" text NOT NULL,
	"stripe_customer_id" text NOT NULL,
	"status" "subscription_status" DEFAULT 'ACTIVE' NOT NULL,
	"current_period_start" timestamp,
	"current_period_end" timestamp,
	"cancelled_at" timestamp,
	"paused_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "subscribable" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "subscription_id" text;--> statement-breakpoint
CREATE INDEX "subscription_plans_product_id_idx" ON "subscription_plans" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "subscription_plans_variant_id_idx" ON "subscription_plans" USING btree ("variant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "subscription_plans_stripe_price_id_idx" ON "subscription_plans" USING btree ("stripe_price_id");--> statement-breakpoint
CREATE INDEX "subscriptions_customer_id_idx" ON "subscriptions" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "subscriptions_plan_id_idx" ON "subscriptions" USING btree ("plan_id");--> statement-breakpoint
CREATE UNIQUE INDEX "subscriptions_stripe_sub_id_idx" ON "subscriptions" USING btree ("stripe_subscription_id");--> statement-breakpoint
CREATE INDEX "subscriptions_status_idx" ON "subscriptions" USING btree ("status");