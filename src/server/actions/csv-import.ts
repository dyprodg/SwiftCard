"use server";

import { db } from "@/db";
import { products, productVariants, productTranslations, categories } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { updateTag, revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import {
  parseCsvToRows,
  validateCsvRows,
  groupRowsByProduct,
  serializeProductsToCsv,
  type CsvImportResult,
  type CsvImportPreview,
  type CsvValidationError,
} from "@/lib/utils/csv-products";
import {
  csvImportOptionsSchema,
  type CsvImportOptions,
} from "@/lib/validations/csv-import";
import { slugify } from "@/lib/utils/slugify";

async function requireAdmin() {
  const { userId, sessionClaims } = await auth();
  if (!userId) throw new Error("Unauthorized");
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (role !== "admin") throw new Error("Unauthorized");
  return userId;
}

// ==================== HELPERS ====================

async function getExistingSkus(): Promise<Set<string>> {
  const variants = await db.select({ sku: productVariants.sku }).from(productVariants);
  return new Set(variants.map((v) => v.sku));
}

async function getCategoryMap(): Promise<Map<string, string>> {
  const cats = await db
    .select({ id: categories.id, slug: categories.slug })
    .from(categories);
  return new Map(cats.map((c) => [c.slug, c.id]));
}

// ==================== EXPORT ====================

export async function exportProductsCsv(filters?: {
  status?: string;
  categoryId?: string;
}): Promise<string> {
  await requireAdmin();

  const conditions = [];
  if (filters?.status) {
    conditions.push(
      eq(products.status, filters.status as (typeof products.status.enumValues)[number]),
    );
  }
  if (filters?.categoryId) {
    conditions.push(eq(products.categoryId, filters.categoryId));
  }

  const where =
    conditions.length > 0
      ? conditions.length === 1
        ? conditions[0]
        : undefined
      : undefined;

  const data = await db.query.products.findMany({
    where,
    with: {
      images: { orderBy: (img, { asc }) => [asc(img.position)] },
      variants: true,
      category: true,
      translations: true,
    },
    orderBy: [desc(products.createdAt)],
    limit: 10000,
  });

  return serializeProductsToCsv(data);
}

// ==================== PREVIEW ====================

export async function previewCsvImport(
  csvText: string,
  mode: CsvImportOptions["mode"],
): Promise<CsvImportPreview> {
  await requireAdmin();

  const { rows, errors: parseErrors } = parseCsvToRows(csvText);
  if (parseErrors.length > 0) {
    return {
      rows,
      errors: parseErrors,
      summary: { toCreate: 0, toUpdate: 0, unchanged: 0 },
    };
  }

  const [existingSkus, categoryMap] = await Promise.all([
    getExistingSkus(),
    getCategoryMap(),
  ]);

  const validationErrors = validateCsvRows(rows, existingSkus, categoryMap, mode);
  const grouped = groupRowsByProduct(rows);

  let toCreate = 0;
  let toUpdate = 0;

  for (const group of grouped) {
    const isExisting = group.productId != null;
    if (isExisting) {
      if (mode !== "CREATE_ONLY") toUpdate++;
    } else {
      // Check if any variant SKU already exists
      const hasExistingSku = group.variants.some((v) => existingSkus.has(v.sku));
      if (hasExistingSku && mode !== "CREATE_ONLY") {
        toUpdate++;
      } else {
        if (mode !== "UPDATE_ONLY") toCreate++;
      }
    }
  }

  return {
    rows,
    errors: [...parseErrors, ...validationErrors],
    summary: {
      toCreate,
      toUpdate,
      unchanged: grouped.length - toCreate - toUpdate,
    },
  };
}

// ==================== EXECUTE ====================

export async function executeCsvImport(
  csvText: string,
  options: CsvImportOptions,
): Promise<CsvImportResult> {
  await requireAdmin();
  const opts = csvImportOptionsSchema.parse(options);

  const { rows, errors: parseErrors } = parseCsvToRows(csvText);
  if (parseErrors.length > 0 && !opts.skipErrors) {
    return { created: 0, updated: 0, skipped: 0, errors: parseErrors };
  }

  const [existingSkus, categoryMap] = await Promise.all([
    getExistingSkus(),
    getCategoryMap(),
  ]);

  const validationErrors = validateCsvRows(rows, existingSkus, categoryMap, opts.mode);

  if (validationErrors.length > 0 && !opts.skipErrors) {
    return {
      created: 0,
      updated: 0,
      skipped: 0,
      errors: [...parseErrors, ...validationErrors],
    };
  }

  if (opts.dryRun) {
    const grouped = groupRowsByProduct(rows);
    let toCreate = 0;
    let toUpdate = 0;
    for (const group of grouped) {
      const isExisting =
        group.productId != null || group.variants.some((v) => existingSkus.has(v.sku));
      if (isExisting) {
        if (opts.mode !== "CREATE_ONLY") toUpdate++;
      } else {
        if (opts.mode !== "UPDATE_ONLY") toCreate++;
      }
    }
    return {
      created: toCreate,
      updated: toUpdate,
      skipped: grouped.length - toCreate - toUpdate,
      errors: [...parseErrors, ...validationErrors],
    };
  }

  // Execute import inside a transaction
  const grouped = groupRowsByProduct(rows);
  let created = 0;
  let updated = 0;
  let skipped = 0;
  const importErrors: CsvValidationError[] = [...parseErrors, ...validationErrors];

  await db.transaction(async (tx) => {
    for (const group of grouped) {
      try {
        const categoryId = group.categorySlug
          ? (categoryMap.get(group.categorySlug) ?? null)
          : null;

        // Determine if this is an update or create
        let existingProductId: string | null = null;

        if (group.productId) {
          // Explicit product_id provided
          const existing = await tx.query.products.findFirst({
            where: eq(products.id, group.productId),
          });
          if (existing) existingProductId = existing.id;
        } else {
          // Check if any variant SKU matches an existing product
          for (const variant of group.variants) {
            if (existingSkus.has(variant.sku)) {
              const existingVariant = await tx.query.productVariants.findFirst({
                where: eq(productVariants.sku, variant.sku),
              });
              if (existingVariant) {
                existingProductId = existingVariant.productId;
                break;
              }
            }
          }
        }

        if (existingProductId && opts.mode === "CREATE_ONLY") {
          skipped++;
          continue;
        }
        if (!existingProductId && opts.mode === "UPDATE_ONLY") {
          skipped++;
          continue;
        }

        if (existingProductId) {
          // ===== UPDATE =====
          await tx
            .update(products)
            .set({
              name: group.name,
              slug: group.slug || slugify(group.name),
              description: group.description ?? undefined,
              basePrice: group.basePrice,
              status: group.status,
              featured: group.featured,
              categoryId,
              publishedAt: group.status === "ACTIVE" ? new Date() : undefined,
            })
            .where(eq(products.id, existingProductId));

          // Update translations
          if (group.nameDE) {
            const existingTrans = await tx.query.productTranslations.findFirst({
              where: eq(productTranslations.productId, existingProductId),
            });
            if (existingTrans) {
              await tx
                .update(productTranslations)
                .set({
                  name: group.nameDE,
                  description: group.descriptionDE ?? undefined,
                })
                .where(eq(productTranslations.id, existingTrans.id));
            } else {
              await tx.insert(productTranslations).values({
                productId: existingProductId,
                locale: "de",
                name: group.nameDE,
                description: group.descriptionDE,
              });
            }
          }

          // Upsert variants
          for (const variant of group.variants) {
            const existingVariant = await tx.query.productVariants.findFirst({
              where: eq(productVariants.sku, variant.sku),
            });

            if (existingVariant) {
              await tx
                .update(productVariants)
                .set({
                  size: variant.size ?? undefined,
                  color: variant.color ?? undefined,
                  material: variant.material ?? undefined,
                  weight: variant.weight ?? undefined,
                  stock: variant.stock,
                  priceAdjustment: variant.priceAdjustment,
                })
                .where(eq(productVariants.id, existingVariant.id));
            } else {
              await tx.insert(productVariants).values({
                productId: existingProductId,
                sku: variant.sku,
                size: variant.size,
                color: variant.color,
                material: variant.material,
                weight: variant.weight,
                stock: variant.stock,
                priceAdjustment: variant.priceAdjustment,
              });
            }
          }

          updated++;
        } else {
          // ===== CREATE =====
          const slug = group.slug || slugify(group.name);

          const [product] = await tx
            .insert(products)
            .values({
              name: group.name,
              slug,
              description: group.description,
              basePrice: group.basePrice,
              status: group.status,
              featured: group.featured,
              categoryId,
              publishedAt: group.status === "ACTIVE" ? new Date() : null,
            })
            .returning();

          // Create DE translation if provided
          if (group.nameDE) {
            await tx.insert(productTranslations).values({
              productId: product.id,
              locale: "de",
              name: group.nameDE,
              description: group.descriptionDE,
            });
          }

          // Create variants
          for (const variant of group.variants) {
            await tx.insert(productVariants).values({
              productId: product.id,
              sku: variant.sku,
              size: variant.size,
              color: variant.color,
              material: variant.material,
              weight: variant.weight,
              stock: variant.stock,
              priceAdjustment: variant.priceAdjustment,
            });
          }

          created++;
        }
      } catch (error) {
        if (!opts.skipErrors) throw error;
        importErrors.push({
          row: 0,
          column: "",
          message: `Failed to import "${group.name}": ${error instanceof Error ? error.message : "Unknown error"}`,
        });
        skipped++;
      }
    }
  });

  // Invalidate caches
  updateTag("products");
  updateTag("product");
  revalidatePath("/[locale]/admin/products", "page");

  return { created, updated, skipped, errors: importErrors };
}
