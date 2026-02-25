"use server";

import { db } from "@/db";
import {
  bundles,
  bundleItems,
  bundleTranslations,
  products,
  productVariants,
  productImages,
} from "@/db/schema";
import { eq, and, ilike } from "drizzle-orm";
import { revalidatePath, updateTag } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import {
  createBundleSchema,
  updateBundleSchema,
  type CreateBundleInput,
  type UpdateBundleInput,
} from "@/lib/validations/bundle";
import { slugify } from "@/lib/utils/slugify";
import { allocateBundlePrice } from "@/lib/utils/bundle-calculator";
import { getCart, setCart, guestCartKey, type CartItem } from "@/lib/kv";

async function requireAdmin() {
  const { userId, sessionClaims } = await auth();
  if (!userId) throw new Error("Unauthorized");
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (role !== "admin") throw new Error("Unauthorized");
  return userId;
}

// ==================== ADMIN CRUD ====================

export async function createBundle(input: CreateBundleInput) {
  await requireAdmin();
  const data = createBundleSchema.parse(input);
  const slug = data.slug || slugify(data.name);

  return db.transaction(async (tx) => {
    const [bundle] = await tx
      .insert(bundles)
      .values({
        name: data.name,
        slug,
        description: data.description,
        bundlePrice: data.bundlePrice,
        status: data.status,
        featured: data.featured,
      })
      .returning();

    if (data.items.length > 0) {
      await tx.insert(bundleItems).values(
        data.items.map((item, idx) => ({
          bundleId: bundle.id,
          productId: item.productId,
          variantId: item.variantId ?? null,
          quantity: item.quantity ?? 1,
          position: item.position ?? idx,
        })),
      );
    }

    if (data.translations && data.translations.length > 0) {
      await tx.insert(bundleTranslations).values(
        data.translations.map((t) => ({
          bundleId: bundle.id,
          locale: t.locale,
          name: t.name,
          description: t.description,
        })),
      );
    }

    updateTag("bundles");
    revalidatePath("/[locale]/admin/bundles", "page");
    return bundle;
  });
}

export async function updateBundle(input: UpdateBundleInput) {
  await requireAdmin();
  const data = updateBundleSchema.parse(input);
  const { id, items, translations, ...updates } = data;

  return db.transaction(async (tx) => {
    if (Object.keys(updates).length > 0) {
      await tx.update(bundles).set(updates).where(eq(bundles.id, id));
    }

    // Replace items if provided
    if (items) {
      await tx.delete(bundleItems).where(eq(bundleItems.bundleId, id));
      if (items.length > 0) {
        await tx.insert(bundleItems).values(
          items.map((item, idx) => ({
            bundleId: id,
            productId: item.productId,
            variantId: item.variantId ?? null,
            quantity: item.quantity ?? 1,
            position: item.position ?? idx,
          })),
        );
      }
    }

    // Replace translations if provided
    if (translations) {
      await tx.delete(bundleTranslations).where(eq(bundleTranslations.bundleId, id));
      if (translations.length > 0) {
        await tx.insert(bundleTranslations).values(
          translations.map((t) => ({
            bundleId: id,
            locale: t.locale,
            name: t.name,
            description: t.description,
          })),
        );
      }
    }

    updateTag("bundles");
    updateTag("bundle");
    revalidatePath("/[locale]/admin/bundles", "page");
  });
}

export async function deleteBundle(id: string) {
  await requireAdmin();

  await db.transaction(async (tx) => {
    await tx.delete(bundleItems).where(eq(bundleItems.bundleId, id));
    await tx.delete(bundleTranslations).where(eq(bundleTranslations.bundleId, id));
    await tx.delete(bundles).where(eq(bundles.id, id));
  });

  updateTag("bundles");
  updateTag("bundle");
  revalidatePath("/[locale]/admin/bundles", "page");
}

// ==================== PRODUCT SEARCH (for bundle builder) ====================

export async function searchProductsForBundle(query: string) {
  await requireAdmin();

  if (query.trim().length < 2) return [];

  return db.query.products.findMany({
    where: and(eq(products.status, "ACTIVE"), ilike(products.name, `%${query}%`)),
    with: {
      images: { limit: 1 },
      variants: true,
    },
    limit: 20,
  });
}

// ==================== ADD BUNDLE TO CART ====================

export async function addBundleToCart(
  bundleId: string,
  variantSelections?: Record<string, string>, // bundleItemId -> variantId
): Promise<{ success: boolean; error?: string }> {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get("cart_session")?.value;
    if (!sessionId) return { success: false, error: "No cart session" };

    const cartId = guestCartKey(sessionId);

    // Fetch bundle with items
    const bundle = await db.query.bundles.findFirst({
      where: and(eq(bundles.id, bundleId), eq(bundles.status, "ACTIVE")),
      with: {
        items: {
          with: {
            product: {
              with: { images: true, variants: true },
            },
            variant: true,
          },
          orderBy: (item, { asc }) => [asc(item.position)],
        },
      },
    });

    if (!bundle) return { success: false, error: "Bundle not found" };

    // Resolve variants (pre-set or customer-selected)
    const resolvedItems: {
      bundleItemId: string;
      product: (typeof bundle.items)[0]["product"];
      variant: (typeof bundle.items)[0]["variant"];
      quantity: number;
      unitPrice: number;
    }[] = [];

    for (const item of bundle.items) {
      let variant = item.variant;

      // If no variant pre-set, customer must select one
      if (!variant && item.product.variants.length > 0) {
        const selectedVariantId = variantSelections?.[item.id];
        if (!selectedVariantId) {
          return {
            success: false,
            error: `Please select a variant for ${item.product.name}`,
          };
        }
        variant = item.product.variants.find((v) => v.id === selectedVariantId) ?? null;
        if (!variant) {
          return { success: false, error: "Invalid variant selection" };
        }
      }

      // Check stock
      if (variant && variant.stock < item.quantity) {
        return {
          success: false,
          error: `Not enough stock for ${item.product.name}`,
        };
      }

      const unitPrice = item.product.basePrice + (variant?.priceAdjustment ?? 0);

      resolvedItems.push({
        bundleItemId: item.id,
        product: item.product,
        variant,
        quantity: item.quantity,
        unitPrice,
      });
    }

    // Allocate bundle price proportionally
    const allocations = allocateBundlePrice(
      bundle.bundlePrice,
      resolvedItems.map((ri) => ({
        id: ri.bundleItemId,
        unitPrice: ri.unitPrice,
        quantity: ri.quantity,
      })),
    );

    // Build cart items
    const cart = await getCart(cartId);
    const newItems: CartItem[] = resolvedItems.map((ri) => {
      const allocation = allocations.find((a) => a.id === ri.bundleItemId);
      const allocatedUnitPrice = allocation
        ? Math.round(allocation.allocatedPrice / ri.quantity)
        : ri.unitPrice;
      const variantName = ri.variant
        ? [ri.variant.size, ri.variant.color, ri.variant.material]
            .filter(Boolean)
            .join(" / ")
        : null;

      return {
        productId: ri.product.id,
        variantId: ri.variant?.id ?? null,
        quantity: ri.quantity,
        productName: ri.product.name,
        variantName,
        unitPrice: allocatedUnitPrice,
        imageUrl: ri.product.images[0]?.url ?? null,
        categoryId: ri.product.categoryId,
        bundleId: bundle.id,
      };
    });

    await setCart(cartId, [...cart, ...newItems]);
    return { success: true };
  } catch (error) {
    console.error("Failed to add bundle to cart:", error);
    return { success: false, error: "Failed to add bundle to cart" };
  }
}
