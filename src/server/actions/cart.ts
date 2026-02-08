"use server";

import { cookies } from "next/headers";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { products, productImages, productVariants } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import {
  getCart,
  setCart,
  deleteCart,
  cartKey,
  guestCartKey,
  type CartItem,
} from "@/lib/kv";

// ==================== HELPERS ====================

async function getCartId(): Promise<string> {
  // Always use the cart_session cookie as the cart key.
  // This ensures the same cart is used in both server actions and API routes
  // (API routes are excluded from the proxy/Clerk middleware matcher).
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("cart_session")?.value;

  if (!sessionId) {
    throw new Error("No cart session found");
  }

  return guestCartKey(sessionId);
}

// ==================== ACTIONS ====================

export async function getServerCart(): Promise<CartItem[]> {
  try {
    const cartId = await getCartId();
    return await getCart(cartId);
  } catch {
    return [];
  }
}

export async function addToCart(
  productId: string,
  variantId: string | null,
  quantity: number = 1,
): Promise<{ success: boolean; error?: string; items?: CartItem[] }> {
  try {
    const cartId = await getCartId();

    // Fetch product data
    const [product] = await db.select().from(products).where(eq(products.id, productId));

    if (!product || product.status !== "ACTIVE") {
      return { success: false, error: "Product not available" };
    }

    // Check variant stock
    let unitPrice = product.basePrice;
    let variantName: string | null = null;

    if (variantId) {
      const [variant] = await db
        .select()
        .from(productVariants)
        .where(
          and(
            eq(productVariants.id, variantId),
            eq(productVariants.productId, productId),
          ),
        );

      if (!variant || !variant.isAvailable || variant.stock <= 0) {
        return { success: false, error: "Variant not available" };
      }

      unitPrice = product.basePrice + variant.priceAdjustment;
      variantName = [variant.size, variant.color, variant.material]
        .filter(Boolean)
        .join(" / ");
    }

    // Get product image
    const images = await db
      .select()
      .from(productImages)
      .where(eq(productImages.productId, productId))
      .limit(1);

    const imageUrl = images[0]?.url ?? null;

    // Read current cart
    const cart = await getCart(cartId);
    const existingIndex = cart.findIndex(
      (item) => item.productId === productId && item.variantId === variantId,
    );

    if (existingIndex >= 0) {
      // Check stock for updated quantity
      if (variantId) {
        const [variant] = await db
          .select()
          .from(productVariants)
          .where(eq(productVariants.id, variantId));

        if (variant && cart[existingIndex].quantity + quantity > variant.stock) {
          return { success: false, error: "Not enough stock" };
        }
      }

      cart[existingIndex].quantity += quantity;
    } else {
      cart.push({
        productId,
        variantId,
        quantity,
        productName: product.name,
        variantName,
        unitPrice,
        imageUrl,
      });
    }

    await setCart(cartId, cart);
    return { success: true, items: cart };
  } catch (error) {
    console.error("Failed to add to cart:", error);
    return { success: false, error: "Failed to add to cart" };
  }
}

export async function updateCartItem(
  productId: string,
  variantId: string | null,
  quantity: number,
): Promise<{ success: boolean; error?: string; items?: CartItem[] }> {
  try {
    const cartId = await getCartId();
    const cart = await getCart(cartId);

    if (quantity <= 0) {
      const updated = cart.filter(
        (item) => !(item.productId === productId && item.variantId === variantId),
      );
      await setCart(cartId, updated);
      return { success: true, items: updated };
    }

    // Check stock
    if (variantId) {
      const [variant] = await db
        .select()
        .from(productVariants)
        .where(eq(productVariants.id, variantId));

      if (variant && quantity > variant.stock) {
        return { success: false, error: "Not enough stock" };
      }
    }

    const updated = cart.map((item) =>
      item.productId === productId && item.variantId === variantId
        ? { ...item, quantity }
        : item,
    );

    await setCart(cartId, updated);
    return { success: true, items: updated };
  } catch (error) {
    console.error("Failed to update cart:", error);
    return { success: false, error: "Failed to update cart" };
  }
}

export async function removeFromCart(
  productId: string,
  variantId: string | null,
): Promise<{ success: boolean; error?: string; items?: CartItem[] }> {
  try {
    const cartId = await getCartId();
    const cart = await getCart(cartId);
    const updated = cart.filter(
      (item) => !(item.productId === productId && item.variantId === variantId),
    );
    await setCart(cartId, updated);
    return { success: true, items: updated };
  } catch (error) {
    console.error("Failed to remove from cart:", error);
    return { success: false, error: "Failed to remove from cart" };
  }
}

export async function mergeGuestCart(): Promise<void> {
  try {
    const { userId } = await auth();
    if (!userId) return;

    const cookieStore = await cookies();
    const sessionId = cookieStore.get("cart_session")?.value;
    if (!sessionId) return;

    const guestKey = guestCartKey(sessionId);
    const userKey = cartKey(userId);

    const guestCart = await getCart(guestKey);
    if (guestCart.length === 0) return;

    const userCart = await getCart(userKey);

    // Merge: guest items added if not already in user cart
    const merged = [...userCart];
    for (const guestItem of guestCart) {
      const existing = merged.find(
        (item) =>
          item.productId === guestItem.productId &&
          item.variantId === guestItem.variantId,
      );
      if (existing) {
        existing.quantity += guestItem.quantity;
      } else {
        merged.push(guestItem);
      }
    }

    await setCart(userKey, merged);
    await deleteCart(guestKey);
  } catch (error) {
    console.error("Failed to merge guest cart:", error);
  }
}
