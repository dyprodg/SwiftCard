"use server";

import { db } from "@/db";
import { discounts, discountProducts, discountCategories } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { revalidatePath, updateTag } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import {
  createDiscountSchema,
  updateDiscountSchema,
  type CreateDiscountInput,
  type UpdateDiscountInput,
} from "@/lib/validations/discount";
import {
  getDiscountByCode,
  getActiveAutomaticDiscounts,
} from "@/server/queries/discounts";
import {
  calculateDiscount,
  findBestAutomaticDiscount,
  toAppliedDiscount,
} from "@/lib/utils/discount-calculator";
import { getCart, guestCartKey } from "@/lib/kv";
import { cookies } from "next/headers";
import { products as productsTable } from "@/db/schema/products";
import type { AppliedDiscount } from "@/types";

async function requireAdmin() {
  const { userId, sessionClaims } = await auth();
  if (!userId) throw new Error("Unauthorized");
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (role !== "admin") throw new Error("Unauthorized");
  return userId;
}

// ==================== ADMIN CRUD ====================

export async function createDiscount(input: CreateDiscountInput) {
  await requireAdmin();
  const data = createDiscountSchema.parse(input);

  const [discount] = await db
    .insert(discounts)
    .values({
      name: data.name,
      description: data.description || null,
      type: data.type,
      value: data.value,
      active: data.active,
      automatic: data.automatic,
      code: data.automatic ? null : data.code?.toUpperCase() || null,
      minOrderAmount: data.minOrderAmount || null,
      maxUses: data.maxUses || null,
      maxUsesPerCustomer: data.maxUsesPerCustomer || null,
      startsAt: data.startsAt ? new Date(data.startsAt) : null,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
    })
    .returning();

  // Insert product scopes
  if (data.productIds.length > 0) {
    await db.insert(discountProducts).values(
      data.productIds.map((productId) => ({
        discountId: discount.id,
        productId,
      })),
    );
  }

  // Insert category scopes
  if (data.categoryIds.length > 0) {
    await db.insert(discountCategories).values(
      data.categoryIds.map((categoryId) => ({
        discountId: discount.id,
        categoryId,
      })),
    );
  }

  updateTag("discounts");
  revalidatePath("/[locale]/admin/discounts", "page");
  return discount;
}

export async function updateDiscount(input: UpdateDiscountInput) {
  await requireAdmin();
  const data = updateDiscountSchema.parse(input);
  const { id, productIds, categoryIds, ...updates } = data;

  const [discount] = await db
    .update(discounts)
    .set({
      name: updates.name,
      description: updates.description || null,
      type: updates.type,
      value: updates.value,
      active: updates.active,
      automatic: updates.automatic,
      code: updates.automatic ? null : updates.code?.toUpperCase() || null,
      minOrderAmount: updates.minOrderAmount || null,
      maxUses: updates.maxUses || null,
      maxUsesPerCustomer: updates.maxUsesPerCustomer || null,
      startsAt: updates.startsAt ? new Date(updates.startsAt) : null,
      expiresAt: updates.expiresAt ? new Date(updates.expiresAt) : null,
    })
    .where(eq(discounts.id, id))
    .returning();

  // Replace product scopes
  await db.delete(discountProducts).where(eq(discountProducts.discountId, id));
  if (productIds.length > 0) {
    await db.insert(discountProducts).values(
      productIds.map((productId) => ({
        discountId: id,
        productId,
      })),
    );
  }

  // Replace category scopes
  await db.delete(discountCategories).where(eq(discountCategories.discountId, id));
  if (categoryIds.length > 0) {
    await db.insert(discountCategories).values(
      categoryIds.map((categoryId) => ({
        discountId: id,
        categoryId,
      })),
    );
  }

  updateTag("discounts");
  revalidatePath("/[locale]/admin/discounts", "page");
  return discount;
}

export async function deleteDiscount(id: string) {
  await requireAdmin();

  await db.delete(discountProducts).where(eq(discountProducts.discountId, id));
  await db.delete(discountCategories).where(eq(discountCategories.discountId, id));
  await db.delete(discounts).where(eq(discounts.id, id));

  updateTag("discounts");
  revalidatePath("/[locale]/admin/discounts", "page");
}

export async function toggleDiscountActive(id: string, active: boolean) {
  await requireAdmin();

  const [discount] = await db
    .update(discounts)
    .set({ active })
    .where(eq(discounts.id, id))
    .returning();

  updateTag("discounts");
  revalidatePath("/[locale]/admin/discounts", "page");
  return discount;
}

// ==================== STOREFRONT ====================

export async function validateCoupon(
  code: string,
): Promise<{ valid: boolean; discount?: AppliedDiscount; error?: string }> {
  const discount = await getDiscountByCode(code);
  if (!discount) {
    return { valid: false, error: "invalidCode" };
  }

  // Check per-customer usage
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("cart_session")?.value;

  if (discount.maxUsesPerCustomer && sessionId) {
    // Per-customer check happens at checkout
  }

  return {
    valid: true,
    discount: {
      id: discount.id,
      code: discount.code,
      name: discount.name,
      type: discount.type,
      value: discount.value,
      amount: 0, // Will be calculated with cart context
      freeShipping: discount.type === "FREE_SHIPPING",
      productIds: discount.products.map((p) => p.productId),
      categoryIds: discount.categories.map((c) => c.categoryId),
    },
  };
}

export async function getCartDiscount(
  couponCode?: string,
): Promise<AppliedDiscount | null> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("cart_session")?.value;
  if (!sessionId) return null;

  const cartId = guestCartKey(sessionId);
  const cartItems = await getCart(cartId);
  if (cartItems.length === 0) return null;

  // Enrich cart items with categoryId
  const productIds = [...new Set(cartItems.map((i) => i.productId))];
  const productRows = await db
    .select({ id: productsTable.id, categoryId: productsTable.categoryId })
    .from(productsTable)
    .where(sql`${productsTable.id} IN ${productIds}`);

  const categoryMap = new Map(productRows.map((p) => [p.id, p.categoryId]));

  const enrichedItems = cartItems.map((item) => ({
    productId: item.productId,
    categoryId: categoryMap.get(item.productId) ?? null,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
  }));

  const subtotal = enrichedItems.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0,
  );

  // If a coupon code is provided, validate and calculate
  if (couponCode) {
    const discount = await getDiscountByCode(couponCode);
    if (!discount) return null;

    const result = calculateDiscount(
      {
        ...discount,
        productIds: discount.products.map((p) => p.productId),
        categoryIds: discount.categories.map((c) => c.categoryId),
      },
      enrichedItems,
      subtotal,
    );

    return result ? toAppliedDiscount(result) : null;
  }

  // Otherwise, find best automatic discount
  const autoDiscounts = await getActiveAutomaticDiscounts();
  const enrichedAutoDiscounts = autoDiscounts.map((d) => ({
    ...d,
    productIds: d.products.map((p) => p.productId),
    categoryIds: d.categories.map((c) => c.categoryId),
  }));

  const best = findBestAutomaticDiscount(enrichedAutoDiscounts, enrichedItems, subtotal);
  return best ? toAppliedDiscount(best) : null;
}
