export const dynamic = "force-dynamic";

import Link from "next/link";
import { getLocale } from "next-intl/server";
import {
  DollarSign,
  ShoppingCart,
  CreditCard,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";

import { getDashboardMetrics, getLowStockAlerts } from "@/server/queries/dashboard";
import { formatPrice } from "@/lib/utils/format-price";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  OrderStatusBadge,
  PaymentStatusBadge,
} from "@/components/admin/order-status-badge";
import { isMaintenanceMode } from "@/lib/edge-config";
import { updateMaintenanceMode } from "@/server/actions/settings";
import { MaintenanceToggle } from "./maintenance-toggle";

export default async function DashboardPage() {
  const locale = await getLocale();
  const [metrics, lowStock, maintenance] = await Promise.all([
    getDashboardMetrics(),
    getLowStockAlerts(),
    isMaintenanceMode(),
  ]);

  const cards = [
    {
      title: "Total Revenue",
      value: formatPrice(metrics.revenue),
      icon: DollarSign,
    },
    {
      title: "Total Orders",
      value: metrics.totalCount.toString(),
      icon: ShoppingCart,
    },
    {
      title: "Paid Orders",
      value: metrics.paidCount.toString(),
      icon: CreditCard,
    },
    {
      title: "Avg. Order Value",
      value: formatPrice(metrics.avgOrderValue),
      icon: TrendingUp,
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Overview of your store performance</p>
        </div>
        <MaintenanceToggle enabled={maintenance} toggleAction={updateMaintenanceMode} />
      </div>

      {/* Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-muted-foreground text-sm font-medium">
                {card.title}
              </CardTitle>
              <card.icon className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Low Stock Alerts */}
      {lowStock.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Low Stock Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Variant</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lowStock.map((item) => (
                  <TableRow key={item.variantId}>
                    <TableCell className="font-mono text-sm">{item.sku}</TableCell>
                    <TableCell>
                      <Link
                        href={`/${locale}/admin/products/${item.productId}/edit`}
                        className="hover:underline"
                      >
                        {item.productName}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {[item.size, item.color].filter(Boolean).join(" / ") || "—"}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      <span
                        className={item.stock === 0 ? "text-red-600" : "text-yellow-600"}
                      >
                        {item.stock}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {metrics.recentOrders.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-muted-foreground h-24 text-center"
                  >
                    No orders yet
                  </TableCell>
                </TableRow>
              ) : (
                metrics.recentOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <Link
                        href={`/${locale}/admin/orders/${order.id}`}
                        className="font-medium hover:underline"
                      >
                        {order.orderNumber}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {order.customerEmail}
                    </TableCell>
                    <TableCell>
                      <OrderStatusBadge status={order.status} />
                    </TableCell>
                    <TableCell>
                      <PaymentStatusBadge status={order.paymentStatus} />
                    </TableCell>
                    <TableCell className="text-right">
                      {formatPrice(order.total, order.currency)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {order.createdAt.toLocaleDateString("de-CH")}
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
