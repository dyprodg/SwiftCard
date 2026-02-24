CREATE TABLE "abandoned_carts" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"user_id" text,
	"email" text,
	"items" jsonb NOT NULL,
	"subtotal" integer NOT NULL,
	"recovery_token" text NOT NULL,
	"email_sent_at" timestamp,
	"recovered_at" timestamp,
	"abandoned_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer_addresses" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"label" text NOT NULL,
	"name" text NOT NULL,
	"phone" text,
	"company" text,
	"address1" text NOT NULL,
	"address2" text,
	"city" text NOT NULL,
	"zip" text NOT NULL,
	"country" text NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "phone" text;--> statement-breakpoint
CREATE UNIQUE INDEX "abandoned_carts_recovery_token_idx" ON "abandoned_carts" USING btree ("recovery_token");--> statement-breakpoint
CREATE INDEX "abandoned_carts_session_id_idx" ON "abandoned_carts" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "abandoned_carts_email_idx" ON "abandoned_carts" USING btree ("email");--> statement-breakpoint
CREATE INDEX "abandoned_carts_abandoned_at_idx" ON "abandoned_carts" USING btree ("abandoned_at");--> statement-breakpoint
CREATE INDEX "abandoned_carts_email_sent_at_idx" ON "abandoned_carts" USING btree ("email_sent_at");--> statement-breakpoint
CREATE INDEX "customer_addresses_user_id_idx" ON "customer_addresses" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "customer_addresses_default_idx" ON "customer_addresses" USING btree ("user_id","is_default");