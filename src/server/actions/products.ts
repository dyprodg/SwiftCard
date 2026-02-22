"use server";

import { db } from "@/db";
import { products, productImages, productVariants, categories } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath, updateTag } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import {
  createProductSchema,
  updateProductSchema,
  createVariantSchema,
  updateVariantSchema,
  createCategorySchema,
  type CreateProductInput,
  type UpdateProductInput,
  type CreateVariantInput,
  type UpdateVariantInput,
  type CreateCategoryInput,
} from "@/lib/validations/product";
import { slugify } from "@/lib/utils/slugify";
import { deleteImage } from "@/lib/blob";

async function requireAdmin() {
  const { userId, sessionClaims } = await auth();
  if (!userId) throw new Error("Unauthorized");
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (role !== "admin") throw new Error("Unauthorized");
  return userId;
}

// ==================== PRODUCTS ====================

export async function createProduct(input: CreateProductInput) {
  await requireAdmin();
  const data = createProductSchema.parse(input);

  const slug = data.slug || slugify(data.name);

  const [product] = await db
    .insert(products)
    .values({
      ...data,
      slug,
      publishedAt: data.status === "ACTIVE" ? new Date() : null,
    })
    .returning();

  updateTag("products");
  updateTag("product");
  revalidatePath("/[locale]/admin/products", "page");
  return product;
}

export async function updateProduct(input: UpdateProductInput) {
  await requireAdmin();
  const data = updateProductSchema.parse(input);
  const { id, ...updates } = data;

  if (updates.name && !updates.slug) {
    updates.slug = slugify(updates.name);
  }

  const [product] = await db
    .update(products)
    .set(updates)
    .where(eq(products.id, id))
    .returning();

  updateTag("products");
  updateTag("product");
  revalidatePath("/[locale]/admin/products", "page");
  return product;
}

export async function deleteProduct(id: string) {
  await requireAdmin();

  // Get images to delete from Blob storage
  const images = await db
    .select()
    .from(productImages)
    .where(eq(productImages.productId, id));

  // Delete images from Blob storage
  await Promise.all(
    images
      .filter((img) => img.url.includes("blob.vercel-storage.com"))
      .map((img) => deleteImage(img.url).catch(() => {})),
  );

  // Delete product (cascades to images, variants, translations)
  await db.delete(products).where(eq(products.id, id));

  updateTag("products");
  updateTag("product");
  revalidatePath("/[locale]/admin/products", "page");
}

export async function updateProductStatus(
  id: string,
  status: "DRAFT" | "ACTIVE" | "ARCHIVED",
) {
  await requireAdmin();

  const [product] = await db
    .update(products)
    .set({
      status,
      publishedAt: status === "ACTIVE" ? new Date() : undefined,
    })
    .where(eq(products.id, id))
    .returning();

  updateTag("products");
  updateTag("product");
  revalidatePath("/[locale]/admin/products", "page");
  return product;
}

// ==================== IMAGES ====================

export async function addProductImage(productId: string, url: string, alt?: string) {
  await requireAdmin();

  // Get the next position
  const existing = await db
    .select()
    .from(productImages)
    .where(eq(productImages.productId, productId));

  const [image] = await db
    .insert(productImages)
    .values({
      productId,
      url,
      alt,
      position: existing.length,
    })
    .returning();

  revalidatePath("/[locale]/admin/products", "page");
  return image;
}

export async function deleteProductImage(id: string) {
  await requireAdmin();

  const [image] = await db.select().from(productImages).where(eq(productImages.id, id));

  if (image?.url.includes("blob.vercel-storage.com")) {
    await deleteImage(image.url).catch(() => {});
  }

  await db.delete(productImages).where(eq(productImages.id, id));

  revalidatePath("/[locale]/admin/products", "page");
}

// ==================== VARIANTS ====================

export async function createVariant(input: CreateVariantInput) {
  await requireAdmin();
  const data = createVariantSchema.parse(input);

  const [variant] = await db.insert(productVariants).values(data).returning();

  updateTag("products");
  updateTag("product");
  revalidatePath("/[locale]/admin/products", "page");
  return variant;
}

export async function updateVariant(input: UpdateVariantInput) {
  await requireAdmin();
  const data = updateVariantSchema.parse(input);
  const { id, ...updates } = data;

  const [variant] = await db
    .update(productVariants)
    .set(updates)
    .where(eq(productVariants.id, id))
    .returning();

  updateTag("products");
  updateTag("product");
  revalidatePath("/[locale]/admin/products", "page");
  return variant;
}

export async function deleteVariant(id: string) {
  await requireAdmin();
  await db.delete(productVariants).where(eq(productVariants.id, id));

  updateTag("products");
  updateTag("product");
  revalidatePath("/[locale]/admin/products", "page");
}

// ==================== CATEGORIES ====================

export async function createCategory(input: CreateCategoryInput) {
  await requireAdmin();
  const data = createCategorySchema.parse(input);

  const slug = data.slug || slugify(data.name);

  const [category] = await db
    .insert(categories)
    .values({ ...data, slug })
    .returning();

  updateTag("categories");
  revalidatePath("/[locale]/admin/products", "page");
  return category;
}
