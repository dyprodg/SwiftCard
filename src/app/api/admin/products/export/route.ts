import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { products } from "@/db/schema/products";
import { desc, and, eq, ilike } from "drizzle-orm";
import { serializeProductsToCsv } from "@/lib/utils/csv-products";

export async function GET(req: NextRequest) {
  const { userId, sessionClaims } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (role !== "admin") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const params = req.nextUrl.searchParams;
  const status = params.get("status") || undefined;
  const categoryId = params.get("categoryId") || undefined;
  const search = params.get("search") || undefined;

  const conditions = [];
  if (status) {
    conditions.push(
      eq(products.status, status as (typeof products.status.enumValues)[number]),
    );
  }
  if (categoryId) {
    conditions.push(eq(products.categoryId, categoryId));
  }
  if (search) {
    conditions.push(ilike(products.name, `%${search}%`));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const data = await db.query.products.findMany({
    where,
    with: {
      images: { orderBy: (img, { asc }) => [asc(img.position)] },
      variants: true,
      category: true,
      translations: true,
    },
    orderBy: [desc(products.createdAt)],
    limit: 10000,
  });

  const csv = serializeProductsToCsv(data);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="products-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
