import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { generateCsvTemplate } from "@/lib/utils/csv-products";

export async function GET() {
  const { userId, sessionClaims } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (role !== "admin") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const csv = generateCsvTemplate();

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="product-import-template.csv"`,
    },
  });
}
