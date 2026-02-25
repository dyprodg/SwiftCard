import type { Metadata } from "next";
import { auth, currentUser } from "@clerk/nextjs/server";

export const metadata: Metadata = {
  title: "My Orders",
  robots: { index: false, follow: false },
};
import { redirect } from "next/navigation";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { ChevronRight, Package } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getOrdersByCustomer } from "@/server/queries/orders";
import { formatPrice } from "@/lib/utils/format-price";

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  PROCESSING: "bg-purple-100 text-purple-800",
  SHIPPED: "bg-indigo-100 text-indigo-800",
  DELIVERED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
  REFUNDED: "bg-gray-100 text-gray-800",
};

export default async function CustomerOrdersPage() {
  const { userId } = await auth();
  const locale = await getLocale();
  const t = await getTranslations("orders");

  if (!userId) {
    redirect(`/${locale}/sign-in`);
  }

  const user = await currentUser();
  const email = user?.emailAddresses[0]?.emailAddress;

  if (!email) {
    redirect(`/${locale}`);
  }

  const result = await getOrdersByCustomer(email);

  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold">{t("title")}</h2>

      {result.orders.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center">
          <Package className="text-muted-foreground mb-4 h-12 w-12" />
          <h2 className="mb-2 text-lg font-semibold">{t("empty")}</h2>
          <p className="text-muted-foreground mb-4 text-sm">{t("emptyDescription")}</p>
          <Link
            href={`/${locale}/products`}
            className="text-primary text-sm font-medium hover:underline"
          >
            {t("browseProducts")}
          </Link>
        </Card>
      ) : (
        <div className="space-y-4">
          {result.orders.map((order) => (
            <Link key={order.id} href={`/${locale}/order/${order.id}`}>
              <Card className="hover:bg-muted/50 p-6 transition-colors">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold">{order.orderNumber}</p>
                    <p className="text-muted-foreground text-xs">
                      {new Date(order.createdAt).toLocaleDateString(
                        locale === "de" ? "de-CH" : "en-CH",
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        },
                      )}
                    </p>
                  </div>
                  <Badge variant="outline" className={statusColors[order.status] ?? ""}>
                    {t(
                      `statuses.${order.status as "PENDING" | "CONFIRMED" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED" | "REFUNDED"}`,
                    )}
                  </Badge>
                </div>

                <hr className="my-4" />

                <div className="flex items-center justify-between text-sm">
                  <div className="space-y-1">
                    <p>
                      <span className="text-muted-foreground">{t("paymentLabel")} </span>
                      <span className="font-medium">
                        {t(
                          `paymentStatuses.${order.paymentStatus as "PENDING" | "PAID" | "FAILED" | "REFUNDED" | "PARTIALLY_REFUNDED"}`,
                        )}
                      </span>
                    </p>
                    {order.shippedAt && (
                      <p>
                        <span className="text-muted-foreground">
                          {t("shippedLabel")}{" "}
                        </span>
                        {new Date(order.shippedAt).toLocaleDateString(
                          locale === "de" ? "de-CH" : "en-CH",
                        )}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-lg font-semibold">
                      {formatPrice(order.total, order.currency)}
                    </p>
                    <ChevronRight className="text-muted-foreground h-5 w-5" />
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
