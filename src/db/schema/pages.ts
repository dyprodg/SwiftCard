import {
  pgTable,
  pgEnum,
  text,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";

export const pageTypeEnum = pgEnum("page_type", ["PAGE", "BLOG"]);

export const pageStatusEnum = pgEnum("page_status", ["DRAFT", "PUBLISHED", "ARCHIVED"]);

export const pages = pgTable(
  "pages",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    slug: text("slug").notNull(),
    type: pageTypeEnum("type").default("PAGE").notNull(),
    status: pageStatusEnum("status").default("DRAFT").notNull(),
    title: text("title").notNull(),
    content: text("content").notNull().default(""),
    excerpt: text("excerpt"),
    coverImageUrl: text("cover_image_url"),
    metaTitle: text("meta_title"),
    metaDescription: text("meta_description"),
    authorId: text("author_id"),
    tags: text("tags").array().default([]).notNull(),
    publishedAt: timestamp("published_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("pages_slug_idx").on(table.slug),
    index("pages_type_idx").on(table.type),
    index("pages_status_idx").on(table.status),
    index("pages_published_at_idx").on(table.publishedAt),
    // GIN index on tags will be added manually in the migration SQL
    index("pages_tags_idx").on(table.tags),
  ],
);

export const pageTranslations = pgTable(
  "page_translations",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    pageId: text("page_id").notNull(),
    locale: text("locale").notNull(),
    title: text("title"),
    content: text("content"),
    excerpt: text("excerpt"),
    metaTitle: text("meta_title"),
    metaDescription: text("meta_description"),
  },
  (table) => [
    uniqueIndex("page_translations_page_locale_idx").on(table.pageId, table.locale),
    index("page_translations_locale_idx").on(table.locale),
  ],
);
