import { getTranslations, getLocale } from "next-intl/server";
import { ShoppingBag, Mail, RefreshCcw, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getAbandonedCartsForAdmin,
  getAbandonedCartStats,
} from "@/server/queries/abandoned-carts";
import { formatPrice } from "@/lib/utils/format-price";
import type { CartItem } from "@/types";

export default async function AbandonedCartsPage() {
  const t = await getTranslations("admin.abandonedCarts");
  const locale = await getLocale();

  const [carts, stats] = await Promise.all([
    getAbandonedCartsForAdmin(),
    getAbandonedCartStats(),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold">{t("title")}</h1>
      <p className="text-muted-foreground mt-1 mb-6">{t("description")}</p>

      {/* Stats Cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t("totalAbandoned")}</CardTitle>
            <ShoppingBag className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t("recovered")}</CardTitle>
            <RefreshCcw className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {stats.recovered}{" "}
              <span className="text-muted-foreground text-sm font-normal">
                ({stats.recoveryRate}%)
              </span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t("emailsSent")}</CardTitle>
            <Mail className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.emailSent}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t("lostRevenue")}</CardTitle>
            <DollarSign className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatPrice(stats.totalLostRevenue)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("email")}</TableHead>
                <TableHead>{t("items")}</TableHead>
                <TableHead className="text-right">{t("subtotal")}</TableHead>
                <TableHead>{t("abandonedAt")}</TableHead>
                <TableHead>{t("status")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {carts.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-muted-foreground h-24 text-center"
                  >
                    {t("empty")}
                  </TableCell>
                </TableRow>
              ) : (
                carts.map((cart) => {
                  const items = (cart.items as CartItem[]) || [];
                  const isRecovered = !!cart.recoveredAt;
                  const emailSent = !!cart.emailSentAt;

                  return (
                    <TableRow key={cart.id}>
                      <TableCell className="font-medium">
                        {cart.email || t("noEmail")}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {items.length} {t("itemCount")}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatPrice(cart.subtotal)}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(cart.abandonedAt).toLocaleString(
                          locale === "de" ? "de-CH" : "en-CH",
                        )}
                      </TableCell>
                      <TableCell>
                        {isRecovered ? (
                          <Badge
                            variant="default"
                            className="bg-green-100 text-green-800"
                          >
                            {t("statusRecovered")}
                          </Badge>
                        ) : emailSent ? (
                          <Badge variant="secondary">{t("statusEmailSent")}</Badge>
                        ) : (
                          <Badge variant="outline">{t("statusPending")}</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
