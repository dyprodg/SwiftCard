import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/client";
import { purchaseGiftCardSchema } from "@/lib/validations/gift-card";
import { rateLimit } from "@/lib/kv";
import { auth } from "@clerk/nextjs/server";

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const ipLimit = await rateLimit(`gc-checkout:ip:${ip}`, 5, 60);
    if (!ipLimit.success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 },
      );
    }

    const body = await req.json();
    const validation = purchaseGiftCardSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.flatten() },
        { status: 400 },
      );
    }

    const { amount, recipientEmail, recipientName, senderName, personalMessage } =
      validation.data;

    // Get current user if logged in
    let purchaserEmail: string | undefined;
    let purchaserUserId: string | undefined;
    try {
      const { userId, sessionClaims } = await auth();
      if (userId) {
        purchaserUserId = userId;
        purchaserEmail =
          (sessionClaims?.metadata as Record<string, string>)?.email ?? undefined;
      }
    } catch {
      // Not logged in, that's fine
    }

    const origin = req.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "";

    // Create Stripe Checkout Session for the gift card
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "chf",
            unit_amount: amount,
            product_data: {
              name: `Gift Card - CHF ${(amount / 100).toFixed(2)}`,
              description: `Gift card for ${recipientName}`,
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        type: "gift_card_purchase",
        amount: amount.toString(),
        recipientEmail,
        recipientName,
        senderName,
        personalMessage: personalMessage || "",
        ...(purchaserEmail && { purchaserEmail }),
        ...(purchaserUserId && { purchaserUserId }),
      },
      success_url: `${origin}/gift-cards?purchased=true`,
      cancel_url: `${origin}/gift-cards`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Gift card checkout error:", error);
    const message = error instanceof Error ? error.message : "Checkout failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
