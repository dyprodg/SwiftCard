import { pgTable, text, timestamp, index } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";

export const pageViews = pgTable(
  "page_views",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    path: text("path").notNull(),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("page_views_path_idx").on(table.path),
    index("page_views_created_at_idx").on(table.createdAt),
  ],
);
