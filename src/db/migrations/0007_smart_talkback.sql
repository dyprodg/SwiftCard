CREATE TYPE "public"."review_status" AS ENUM('PENDING', 'APPROVED', 'REJECTED');--> statement-breakpoint
CREATE TABLE "product_reviews" (
	"id" text PRIMARY KEY NOT NULL,
	"product_id" text NOT NULL,
	"user_id" text NOT NULL,
	"user_email" text NOT NULL,
	"user_name" text NOT NULL,
	"rating" integer NOT NULL,
	"title" text NOT NULL,
	"body" text,
	"verified" boolean DEFAULT false NOT NULL,
	"status" "review_status" DEFAULT 'PENDING' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stock_notifications" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"variant_id" text NOT NULL,
	"product_id" text NOT NULL,
	"notified_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wishlists" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"product_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "product_reviews_user_product_idx" ON "product_reviews" USING btree ("user_id","product_id");--> statement-breakpoint
CREATE INDEX "product_reviews_product_id_idx" ON "product_reviews" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "product_reviews_status_idx" ON "product_reviews" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "stock_notifications_email_variant_idx" ON "stock_notifications" USING btree ("email","variant_id");--> statement-breakpoint
CREATE INDEX "stock_notifications_variant_id_idx" ON "stock_notifications" USING btree ("variant_id");--> statement-breakpoint
CREATE INDEX "stock_notifications_product_id_idx" ON "stock_notifications" USING btree ("product_id");--> statement-breakpoint
CREATE UNIQUE INDEX "wishlists_user_product_idx" ON "wishlists" USING btree ("user_id","product_id");--> statement-breakpoint
CREATE INDEX "wishlists_user_id_idx" ON "wishlists" USING btree ("user_id");