import type { Metadata } from "next";
import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import Link from "next/link";
import { Package, MapPin, ChevronRight } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getOrdersByCustomer } from "@/server/queries/orders";
import { getDefaultAddress } from "@/server/actions/addresses";
import { formatPrice } from "@/lib/utils/format-price";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("account");
  return {
    title: t("title"),
    robots: { index: false, follow: false },
  };
}

export default async function AccountOverviewPage() {
  const { userId } = await auth();
  const locale = await getLocale();
  const t = await getTranslations("account");

  if (!userId) redirect(`/${locale}/sign-in`);

  const user = await currentUser();
  const email = user?.emailAddresses[0]?.emailAddress;

  if (!email) redirect(`/${locale}`);

  const [orderResult, defaultAddress] = await Promise.all([
    getOrdersByCustomer(email),
    getDefaultAddress(),
  ]);

  const recentOrders = orderResult.orders.slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h2 className="text-lg font-semibold">
          {t("welcome", { name: user?.firstName || email })}
        </h2>
        <p className="text-muted-foreground text-sm">{email}</p>
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">{t("recentOrders")}</CardTitle>
          <Link
            href={`/${locale}/account/orders`}
            className="text-primary text-sm hover:underline"
          >
            {t("viewAll")}
          </Link>
        </CardHeader>
        <CardContent>
          {recentOrders.length === 0 ? (
            <div className="flex flex-col items-center py-6 text-center">
              <Package className="text-muted-foreground mb-2 h-8 w-8" />
              <p className="text-muted-foreground text-sm">{t("noOrders")}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <Link
                  key={order.id}
                  href={`/${locale}/order/${order.id}`}
                  className="hover:bg-muted/50 flex items-center justify-between rounded-md p-2 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium">{order.orderNumber}</p>
                    <p className="text-muted-foreground text-xs">
                      {new Date(order.createdAt).toLocaleDateString(
                        locale === "de" ? "de-CH" : "en-CH",
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {formatPrice(order.total, order.currency)}
                    </span>
                    <ChevronRight className="text-muted-foreground h-4 w-4" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Default Address */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">{t("defaultAddress")}</CardTitle>
          <Link
            href={`/${locale}/account/addresses`}
            className="text-primary text-sm hover:underline"
          >
            {t("manageAddresses")}
          </Link>
        </CardHeader>
        <CardContent>
          {defaultAddress ? (
            <div className="text-sm">
              <p className="font-medium">{defaultAddress.name}</p>
              {defaultAddress.company && (
                <p className="text-muted-foreground">{defaultAddress.company}</p>
              )}
              <p>{defaultAddress.address1}</p>
              {defaultAddress.address2 && <p>{defaultAddress.address2}</p>}
              <p>
                {defaultAddress.zip} {defaultAddress.city}
              </p>
              <p>{defaultAddress.country}</p>
              {defaultAddress.phone && (
                <p className="text-muted-foreground mt-1">{defaultAddress.phone}</p>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center py-6 text-center">
              <MapPin className="text-muted-foreground mb-2 h-8 w-8" />
              <p className="text-muted-foreground text-sm">{t("noAddresses")}</p>
              <Link
                href={`/${locale}/account/addresses`}
                className="text-primary mt-2 text-sm hover:underline"
              >
                {t("addAddress")}
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
