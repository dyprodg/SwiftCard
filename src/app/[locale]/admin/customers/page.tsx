export const dynamic = "force-dynamic";

import { db } from "@/db";
import { orders } from "@/db/schema";
import { sql, desc } from "drizzle-orm";
import { clerkClient } from "@clerk/nextjs/server";
import { getLocale, getTranslations } from "next-intl/server";
import { formatPrice } from "@/lib/utils/format-price";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type CustomerRow = {
  email: string;
  name: string | null;
  orderCount: number;
  totalSpent: number;
  lastOrderDate: Date | null;
  source: "clerk" | "guest";
};

export default async function CustomersPage() {
  const locale = await getLocale();
  const t = await getTranslations("admin.customers");

  // Fetch order aggregates by email
  let aggregateMap = new Map<
    string,
    { orderCount: number; totalSpent: number; lastOrderDate: Date | null }
  >();

  try {
    const orderAggregates = await db
      .select({
        email: orders.customerEmail,
        orderCount: sql<string>`count(*)`.as("order_count"),
        totalSpent: sql<string>`coalesce(sum(${orders.total}), 0)`.as("total_spent"),
        lastOrderDate: sql<string | null>`max(${orders.createdAt})`.as("last_order"),
      })
      .from(orders)
      .groupBy(orders.customerEmail)
      .orderBy(desc(sql`max(${orders.createdAt})`));

    aggregateMap = new Map(
      orderAggregates.map((a) => [
        a.email.toLowerCase(),
        {
          orderCount: Number(a.orderCount),
          totalSpent: Number(a.totalSpent),
          lastOrderDate: a.lastOrderDate ? new Date(a.lastOrderDate) : null,
        },
      ]),
    );
  } catch (e) {
    console.error("Failed to fetch order aggregates:", e);
  }

  // Fetch Clerk users
  const clerk = await clerkClient();
  const { data: users } = await clerk.users.getUserList({ limit: 100 });

  const customers: CustomerRow[] = [];
  const seenEmails = new Set<string>();

  // Merge Clerk users with order data
  for (const user of users) {
    const email = user.emailAddresses[0]?.emailAddress?.toLowerCase() ?? "";
    if (!email) continue;
    seenEmails.add(email);

    const agg = aggregateMap.get(email);
    customers.push({
      email,
      name: [user.firstName, user.lastName].filter(Boolean).join(" ") || null,
      orderCount: agg?.orderCount ?? 0,
      totalSpent: agg?.totalSpent ?? 0,
      lastOrderDate: agg?.lastOrderDate ?? null,
      source: "clerk",
    });
  }

  // Add guest-only customers (no Clerk account)
  for (const [email, agg] of aggregateMap) {
    if (seenEmails.has(email)) continue;
    customers.push({
      email,
      name: null,
      orderCount: agg.orderCount,
      totalSpent: agg.totalSpent,
      lastOrderDate: agg.lastOrderDate,
      source: "guest",
    });
  }

  // Sort: most recent order first
  customers.sort((a, b) => {
    if (!a.lastOrderDate && !b.lastOrderDate) return 0;
    if (!a.lastOrderDate) return 1;
    if (!b.lastOrderDate) return -1;
    return b.lastOrderDate.getTime() - a.lastOrderDate.getTime();
  });

  return (
    <div>
      <h1 className="text-2xl font-bold">{t("title")}</h1>
      <p className="text-muted-foreground mt-1 mb-6">
        {t("count", { count: customers.length })}
      </p>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("email")}</TableHead>
                <TableHead>{t("name")}</TableHead>
                <TableHead>{t("type")}</TableHead>
                <TableHead className="text-right">{t("ordersCount")}</TableHead>
                <TableHead className="text-right">{t("totalSpent")}</TableHead>
                <TableHead>{t("lastOrder")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-muted-foreground h-24 text-center"
                  >
                    {t("noCustomers")}
                  </TableCell>
                </TableRow>
              ) : (
                customers.map((c) => (
                  <TableRow key={c.email}>
                    <TableCell className="font-medium">{c.email}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {c.name || "\u2014"}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          c.source === "clerk"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {c.source === "clerk" ? t("account") : t("guest")}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">{c.orderCount}</TableCell>
                    <TableCell className="text-right">
                      {formatPrice(c.totalSpent)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {c.lastOrderDate
                        ? c.lastOrderDate.toLocaleDateString(
                            locale === "de" ? "de-CH" : "en-CH",
                          )
                        : "\u2014"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
