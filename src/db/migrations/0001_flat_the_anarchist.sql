ALTER TABLE "orders" ADD COLUMN "guest_access_token" text;--> statement-breakpoint
UPDATE "orders" SET "guest_access_token" = gen_random_uuid()::text WHERE "guest_access_token" IS NULL;--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "guest_access_token" SET NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "orders_guest_token_idx" ON "orders" USING btree ("guest_access_token");