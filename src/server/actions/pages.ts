"use server";

import { db } from "@/db";
import { pages, pageTranslations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath, updateTag } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import {
  createPageSchema,
  updatePageSchema,
  type CreatePageInput,
  type UpdatePageInput,
} from "@/lib/validations/page";
import { slugify } from "@/lib/utils/slugify";

async function requireAdmin() {
  const { userId, sessionClaims } = await auth();
  if (!userId) throw new Error("Unauthorized");
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (role !== "admin") throw new Error("Unauthorized");
  return userId;
}

function invalidatePages(idOrSlug?: string) {
  updateTag("pages");
  if (idOrSlug) updateTag("page", idOrSlug);
  revalidatePath("/[locale]/admin/pages", "page");
}

export async function createPage(input: CreatePageInput) {
  const authorId = await requireAdmin();
  const data = createPageSchema.parse(input);
  const slug = data.slug || slugify(data.title);

  return db.transaction(async (tx) => {
    const publishedAt = data.status === "PUBLISHED" ? new Date() : null;

    const [page] = await tx
      .insert(pages)
      .values({
        slug,
        type: data.type,
        status: data.status,
        title: data.title,
        content: data.content,
        excerpt: data.excerpt ?? null,
        coverImageUrl: data.coverImageUrl ?? null,
        metaTitle: data.metaTitle ?? null,
        metaDescription: data.metaDescription ?? null,
        authorId,
        tags: data.tags,
        publishedAt,
      })
      .returning();

    if (data.translations && data.translations.length > 0) {
      await tx.insert(pageTranslations).values(
        data.translations.map((t) => ({
          pageId: page.id,
          locale: t.locale,
          title: t.title ?? null,
          content: t.content ?? null,
          excerpt: t.excerpt ?? null,
          metaTitle: t.metaTitle ?? null,
          metaDescription: t.metaDescription ?? null,
        })),
      );
    }

    invalidatePages(page.id);
    return page;
  });
}

export async function updatePage(input: UpdatePageInput) {
  await requireAdmin();
  const data = updatePageSchema.parse(input);
  const { id, translations, ...updates } = data;

  return db.transaction(async (tx) => {
    // Fetch current page to check publishedAt transition
    const current = await tx.query.pages.findFirst({
      where: eq(pages.id, id),
    });

    if (!current) throw new Error("Page not found");

    const slug = updates.slug || (updates.title ? slugify(updates.title) : undefined);

    // Set publishedAt only on the first PUBLISHED transition
    let publishedAt = current.publishedAt;
    if (updates.status === "PUBLISHED" && !current.publishedAt) {
      publishedAt = new Date();
    }

    await tx
      .update(pages)
      .set({
        ...updates,
        ...(slug ? { slug } : {}),
        publishedAt,
        updatedAt: new Date(),
      })
      .where(eq(pages.id, id));

    // Replace all translations
    if (translations !== undefined) {
      await tx.delete(pageTranslations).where(eq(pageTranslations.pageId, id));
      if (translations.length > 0) {
        await tx.insert(pageTranslations).values(
          translations.map((t) => ({
            pageId: id,
            locale: t.locale,
            title: t.title ?? null,
            content: t.content ?? null,
            excerpt: t.excerpt ?? null,
            metaTitle: t.metaTitle ?? null,
            metaDescription: t.metaDescription ?? null,
          })),
        );
      }
    }

    invalidatePages(id);
  });
}

export async function deletePage(id: string) {
  await requireAdmin();

  await db.transaction(async (tx) => {
    await tx.delete(pageTranslations).where(eq(pageTranslations.pageId, id));
    await tx.delete(pages).where(eq(pages.id, id));
  });

  invalidatePages(id);
}
