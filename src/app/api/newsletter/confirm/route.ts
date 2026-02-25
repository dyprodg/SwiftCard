import { NextRequest, NextResponse } from "next/server";
import { confirmSubscription } from "@/server/actions/newsletter";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) {
    return new NextResponse("Missing token", { status: 400 });
  }

  const result = await confirmSubscription(token);
  const locale = req.nextUrl.searchParams.get("locale") || "en";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  if (result.success) {
    return NextResponse.redirect(`${appUrl}/${locale}?subscribed=true`);
  }

  return new NextResponse("Invalid or expired confirmation link.", {
    status: 400,
  });
}
