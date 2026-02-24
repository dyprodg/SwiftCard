import { NextRequest, NextResponse } from "next/server";
import { getAbandonedCartByToken } from "@/server/actions/abandoned-carts";
import { abandonedCarts } from "@/db/schema/customer-profiles";
import { db } from "@/db";
import { eq } from "drizzle-orm";

type Props = {
  params: Promise<{ token: string }>;
};

export async function GET(req: NextRequest, { params }: Props) {
  const { token } = await params;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  try {
    const cart = await getAbandonedCartByToken(token);

    if (!cart) {
      // Cart already recovered or doesn't exist — redirect to store
      return NextResponse.redirect(`${appUrl}/en/products`);
    }

    // Mark as recovered
    await db
      .update(abandonedCarts)
      .set({ recoveredAt: new Date() })
      .where(eq(abandonedCarts.id, cart.id));

    // Encode cart items as base64 URL param so the storefront can restore them
    const itemsBase64 = Buffer.from(JSON.stringify(cart.items)).toString("base64url");

    return NextResponse.redirect(`${appUrl}/en/cart?restore=${itemsBase64}`);
  } catch (error) {
    console.error("Cart recovery error:", error);
    return NextResponse.redirect(`${appUrl}/en/products`);
  }
}
