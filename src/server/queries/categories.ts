import { db } from "@/db";
import { categories } from "@/db/schema";
import { eq, asc } from "drizzle-orm";

export async function getCategories() {
  return db.query.categories.findMany({
    with: {
      children: true,
      products: {
        columns: { id: true },
      },
    },
    orderBy: [asc(categories.name)],
  });
}

export async function getCategoryBySlug(slug: string) {
  return db.query.categories.findFirst({
    where: eq(categories.slug, slug),
    with: {
      children: true,
      parent: true,
    },
  });
}

export async function getCategoryById(id: string) {
  return db.query.categories.findFirst({
    where: eq(categories.id, id),
  });
}
