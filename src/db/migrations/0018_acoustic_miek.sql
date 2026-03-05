CREATE TYPE "public"."page_status" AS ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED');--> statement-breakpoint
CREATE TYPE "public"."page_type" AS ENUM('PAGE', 'BLOG');--> statement-breakpoint
CREATE TABLE "page_translations" (
	"id" text PRIMARY KEY NOT NULL,
	"page_id" text NOT NULL,
	"locale" text NOT NULL,
	"title" text,
	"content" text,
	"excerpt" text,
	"meta_title" text,
	"meta_description" text
);
--> statement-breakpoint
CREATE TABLE "pages" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"type" "page_type" DEFAULT 'PAGE' NOT NULL,
	"status" "page_status" DEFAULT 'DRAFT' NOT NULL,
	"title" text NOT NULL,
	"content" text DEFAULT '' NOT NULL,
	"excerpt" text,
	"cover_image_url" text,
	"meta_title" text,
	"meta_description" text,
	"author_id" text,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"published_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "page_translations_page_locale_idx" ON "page_translations" USING btree ("page_id","locale");--> statement-breakpoint
CREATE INDEX "page_translations_locale_idx" ON "page_translations" USING btree ("locale");--> statement-breakpoint
CREATE UNIQUE INDEX "pages_slug_idx" ON "pages" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "pages_type_idx" ON "pages" USING btree ("type");--> statement-breakpoint
CREATE INDEX "pages_status_idx" ON "pages" USING btree ("status");--> statement-breakpoint
CREATE INDEX "pages_published_at_idx" ON "pages" USING btree ("published_at");--> statement-breakpoint
CREATE INDEX "pages_tags_idx" ON "pages" USING gin ("tags");