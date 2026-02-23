import { NextRequest, NextResponse } from "next/server";
import { expireStaleReservations } from "@/lib/reservations";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await expireStaleReservations();

    return NextResponse.json({
      ok: true,
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Cron expire-reservations error:", error);
    return NextResponse.json({ error: "Failed to expire reservations" }, { status: 500 });
  }
}
