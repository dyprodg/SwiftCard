import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { unsubscribeByToken } from "@/server/actions/newsletter";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) {
    return new NextResponse("Missing token", { status: 400 });
  }

  await unsubscribeByToken(token);
  revalidateTag("newsletter-subscribers", "minutes");

  // Return a simple HTML page confirming unsubscribe
  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Unsubscribed</title>
<style>body{font-family:system-ui,sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0;background:#fafafa;}
.card{text-align:center;padding:40px;background:#fff;border-radius:8px;box-shadow:0 1px 3px rgba(0,0,0,0.1);max-width:400px;}
h1{font-size:24px;margin-bottom:8px;}p{color:#666;font-size:14px;}</style></head>
<body><div class="card">
<h1>Unsubscribed</h1>
<p>You have been unsubscribed from our newsletter. You can re-subscribe at any time from our website.</p>
</div></body></html>`;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html" },
  });
}
