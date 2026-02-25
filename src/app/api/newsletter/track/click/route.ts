import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { campaignSends, emailCampaigns } from "@/db/schema";
import { eq, sql, isNull, and } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const sendId = req.nextUrl.searchParams.get("sid");
  const url = req.nextUrl.searchParams.get("url");

  if (!url) {
    return new NextResponse("Missing URL", { status: 400 });
  }

  if (sendId) {
    try {
      const [updated] = await db
        .update(campaignSends)
        .set({ clickedAt: new Date() })
        .where(and(eq(campaignSends.id, sendId), isNull(campaignSends.clickedAt)))
        .returning({ campaignId: campaignSends.campaignId });

      if (updated) {
        await db
          .update(emailCampaigns)
          .set({
            totalClicked: sql`${emailCampaigns.totalClicked} + 1`,
          })
          .where(eq(emailCampaigns.id, updated.campaignId));
      }
    } catch {
      // Silently fail
    }
  }

  return NextResponse.redirect(url, 302);
}
