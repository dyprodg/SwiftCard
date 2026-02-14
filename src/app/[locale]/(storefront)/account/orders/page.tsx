import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getLocale } from "next-intl/server";
import { ChevronRight, Package } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { getOrdersByCustomer } from "@/server/queries/orders";
import { formatPrice } from "@/lib/utils/format-price";

const statusLabels: Record<string, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  PROCESSING: "Processing",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  REFUNDED: "Refunded",
};

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
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">My Orders</h1>

      {result.orders.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center">
          <Package className="text-muted-foreground mb-4 h-12 w-12" />
          <h2 className="mb-2 text-lg font-semibold">No orders yet</h2>
          <p className="text-muted-foreground mb-4 text-sm">
            When you place an order, it will appear here.
          </p>
          <Link
            href={`/${locale}/products`}
            className="text-primary text-sm font-medium hover:underline"
          >
            Browse Products
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
                      {new Date(order.createdAt).toLocaleDateString("de-CH", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                  <Badge variant="outline" className={statusColors[order.status] ?? ""}>
                    {statusLabels[order.status] ?? order.status}
                  </Badge>
                </div>

                <Separator className="my-4" />

                <div className="flex items-center justify-between text-sm">
                  <div className="space-y-1">
                    <p>
                      <span className="text-muted-foreground">Payment: </span>
                      <span className="font-medium">{order.paymentStatus}</span>
                    </p>
                    {order.shippedAt && (
                      <p>
                        <span className="text-muted-foreground">Shipped: </span>
                        {new Date(order.shippedAt).toLocaleDateString("de-CH")}
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
