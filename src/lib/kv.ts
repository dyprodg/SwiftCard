import Redis from "ioredis";

// ==================== CLIENT ====================

const redis = new Redis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: 3,
  lazyConnect: true,
});

// ==================== TYPES ====================

export type CartItem = {
  productId: string;
  variantId: string | null;
  quantity: number;
  productName: string;
  variantName: string | null;
  unitPrice: number; // cents
  imageUrl: string | null;
};

// ==================== KEYS ====================

const CART_TTL = 604800; // 7 days in seconds

export function cartKey(userId: string): string {
  return `cart:${userId}`;
}

export function guestCartKey(sessionId: string): string {
  return `cart:guest:${sessionId}`;
}

// ==================== CART HELPERS ====================

export async function getCart(cartId: string): Promise<CartItem[]> {
  const raw = await redis.get(cartId);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as CartItem[];
  } catch {
    return [];
  }
}

export async function setCart(cartId: string, items: CartItem[]): Promise<void> {
  if (items.length === 0) {
    await redis.del(cartId);
    return;
  }
  await redis.set(cartId, JSON.stringify(items), "EX", CART_TTL);
}

export async function deleteCart(cartId: string): Promise<void> {
  await redis.del(cartId);
}

// ==================== RATE LIMITING ====================

/**
 * Simple sliding window rate limiter using Redis.
 * Returns true if within limit, false if rate limited.
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<{ success: boolean; remaining: number }> {
  const rateLimitKey = `ratelimit:${key}`;
  const current = await redis.incr(rateLimitKey);

  if (current === 1) {
    await redis.expire(rateLimitKey, windowSeconds);
  }

  return {
    success: current <= limit,
    remaining: Math.max(0, limit - current),
  };
}
