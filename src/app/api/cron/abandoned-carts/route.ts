import { NextRequest, NextResponse } from "next/server";
import {
  findCartsForRecoveryEmail,
  markRecoveryEmailSent,
} from "@/server/actions/abandoned-carts";
import { sendAbandonedCartEmail } from "@/lib/resend";
import type { CartItem } from "@/types";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const carts = await findCartsForRecoveryEmail();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    let sent = 0;

    for (const cart of carts) {
      if (!cart.email) continue;

      const items = (cart.items as CartItem[]).map((item) => ({
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      }));

      try {
        await sendAbandonedCartEmail(cart.email, {
          items,
          subtotal: cart.subtotal,
          currency: "CHF",
          recoveryUrl: `${appUrl}/api/recover-cart/${cart.recoveryToken}`,
        });

        await markRecoveryEmailSent(cart.id);
        sent++;
      } catch (err) {
        console.error(`Failed to send abandoned cart email for ${cart.id}:`, err);
      }
    }

    return NextResponse.json({
      ok: true,
      found: carts.length,
      sent,
    });
  } catch (error) {
    console.error("Abandoned cart cron error:", error);
    return NextResponse.json({ error: "Cron failed" }, { status: 500 });
  }
}
