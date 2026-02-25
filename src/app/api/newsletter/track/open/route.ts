import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { campaignSends, emailCampaigns } from "@/db/schema";
import { eq, sql, isNull, and } from "drizzle-orm";

// 1x1 transparent GIF
const PIXEL = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64",
);

export async function GET(req: NextRequest) {
  const sendId = req.nextUrl.searchParams.get("sid");

  if (sendId) {
    try {
      // Update send record (only first open)
      const [updated] = await db
        .update(campaignSends)
        .set({ openedAt: new Date() })
        .where(and(eq(campaignSends.id, sendId), isNull(campaignSends.openedAt)))
        .returning({ campaignId: campaignSends.campaignId });

      // Increment campaign counter
      if (updated) {
        await db
          .update(emailCampaigns)
          .set({
            totalOpened: sql`${emailCampaigns.totalOpened} + 1`,
          })
          .where(eq(emailCampaigns.id, updated.campaignId));
      }
    } catch {
      // Silently fail — tracking should never break
    }
  }

  return new NextResponse(PIXEL, {
    headers: {
      "Content-Type": "image/gif",
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}
