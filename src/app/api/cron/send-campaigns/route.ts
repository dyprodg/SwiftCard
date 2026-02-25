import { NextRequest, NextResponse } from "next/server";
import { processScheduledCampaigns } from "@/server/actions/newsletter";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const processed = await processScheduledCampaigns();

    return NextResponse.json({
      ok: true,
      processed,
    });
  } catch (error) {
    console.error("Send campaigns cron error:", error);
    return NextResponse.json({ error: "Cron failed" }, { status: 500 });
  }
}
