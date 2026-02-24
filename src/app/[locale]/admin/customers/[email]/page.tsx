import { notFound } from "next/navigation";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { clerkClient } from "@clerk/nextjs/server";
import { ArrowLeft, Package, MapPin, Star, MessageSquare, Heart } from "lucide-react";

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
import { Button } from "@/components/ui/button";
import {
  getCustomerDetailByEmail,
  getCustomerAddressesByUserId,
  getCustomerReviewsByUserId,
  getCustomerWishlistByUserId,
} from "@/server/queries/customer-detail";
import { formatPrice } from "@/lib/utils/format-price";

type Props = {
  params: Promise<{ email: string }>;
};

export default async function CustomerDetailPage({ params }: Props) {
  const { email: encodedEmail } = await params;
  const email = decodeURIComponent(encodedEmail);
  const locale = await getLocale();
  const t = await getTranslations("admin.customerDetail");

  const { orders, stats } = await getCustomerDetailByEmail(email);

  if (orders.length === 0) notFound();

  // Try to find Clerk user for this email
  const clerk = await clerkClient();
  let clerkUser = null;
  let addresses: Awaited<ReturnType<typeof getCustomerAddressesByUserId>> = [];
  let reviews: Awaited<ReturnType<typeof getCustomerReviewsByUserId>> = [];
  let wishlistItems: Awaited<ReturnType<typeof getCustomerWishlistByUserId>> = [];

  try {
    const { data: users } = await clerk.users.getUserList({
      emailAddress: [email],
      limit: 1,
    });
    if (users.length > 0) {
      clerkUser = users[0];
      const userId = clerkUser.id;
      [addresses, reviews, wishlistItems] = await Promise.all([
        getCustomerAddressesByUserId(userId),
        getCustomerReviewsByUserId(userId),
        getCustomerWishlistByUserId(userId),
      ]);
    }
  } catch {
    // Guest customer — no Clerk account
  }

  const customerName = clerkUser
    ? [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || email
    : email;

  return (
    <div>
      <Button variant="ghost" size="sm" asChild className="mb-4">
        <Link href={`/${locale}/admin/customers`}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t("back")}
        </Link>
      </Button>

      <div className="mb-6 flex items-center gap-3">
        <h1 className="text-2xl font-bold">{customerName}</h1>
        <Badge variant={clerkUser ? "default" : "secondary"}>
          {clerkUser ? t("account") : t("guest")}
        </Badge>
      </div>

      {/* Stats */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t("lifetimeValue")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatPrice(stats.totalSpent)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t("totalOrders")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.orderCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t("avgOrderValue")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatPrice(stats.avgOrderValue)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t("totalRefunded")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatPrice(stats.totalRefunded)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Contact Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("contactInfo")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>
              <span className="text-muted-foreground">{t("emailLabel")}: </span>
              {email}
            </div>
            {clerkUser && (
              <>
                <div>
                  <span className="text-muted-foreground">{t("nameLabel")}: </span>
                  {customerName}
                </div>
                <div>
                  <span className="text-muted-foreground">{t("memberSince")}: </span>
                  {new Date(clerkUser.createdAt).toLocaleDateString(
                    locale === "de" ? "de-CH" : "en-CH",
                  )}
                </div>
              </>
            )}
            {stats.firstOrderDate && (
              <div>
                <span className="text-muted-foreground">{t("firstOrder")}: </span>
                {new Date(stats.firstOrderDate).toLocaleDateString(
                  locale === "de" ? "de-CH" : "en-CH",
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Saved Addresses */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <MapPin className="h-4 w-4" />
            <CardTitle className="text-base">
              {t("addresses")} ({addresses.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {addresses.length === 0 ? (
              <p className="text-muted-foreground text-sm">{t("noAddresses")}</p>
            ) : (
              <div className="space-y-3">
                {addresses.map((addr) => (
                  <div key={addr.id} className="rounded-md border p-3 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{addr.label}</span>
                      {addr.isDefault && (
                        <Badge variant="secondary" className="text-xs">
                          <Star className="mr-1 h-3 w-3" />
                          {t("default")}
                        </Badge>
                      )}
                    </div>
                    <p>
                      {addr.name}, {addr.address1}, {addr.zip} {addr.city}, {addr.country}
                    </p>
                    {addr.phone && <p className="text-muted-foreground">{addr.phone}</p>}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Orders */}
      <Card className="mt-6">
        <CardHeader className="flex flex-row items-center gap-2">
          <Package className="h-4 w-4" />
          <CardTitle className="text-base">
            {t("orderHistory")} ({orders.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("orderNumber")}</TableHead>
                <TableHead>{t("status")}</TableHead>
                <TableHead>{t("payment")}</TableHead>
                <TableHead className="text-right">{t("total")}</TableHead>
                <TableHead>{t("date")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>
                    <Link
                      href={`/${locale}/admin/orders/${order.id}`}
                      className="text-primary font-medium hover:underline"
                    >
                      {order.orderNumber}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{order.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{order.paymentStatus}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {formatPrice(order.total, order.currency)}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(order.createdAt).toLocaleDateString(
                      locale === "de" ? "de-CH" : "en-CH",
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Reviews */}
      {reviews.length > 0 && (
        <Card className="mt-6">
          <CardHeader className="flex flex-row items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            <CardTitle className="text-base">
              {t("reviews")} ({reviews.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {reviews.map(({ review, productName }) => (
                <div key={review.id} className="rounded-md border p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{productName}</span>
                    <span className="text-muted-foreground">
                      {"★".repeat(review.rating)}
                      {"☆".repeat(5 - review.rating)}
                    </span>
                  </div>
                  <p className="font-medium">{review.title}</p>
                  {review.body && <p className="text-muted-foreground">{review.body}</p>}
                  <Badge variant="outline" className="mt-1 text-xs">
                    {review.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Wishlist */}
      {wishlistItems.length > 0 && (
        <Card className="mt-6">
          <CardHeader className="flex flex-row items-center gap-2">
            <Heart className="h-4 w-4" />
            <CardTitle className="text-base">
              {t("wishlist")} ({wishlistItems.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {wishlistItems.map(({ wishlist, productName, productSlug }) => (
                <Badge key={wishlist.id} variant="secondary">
                  {productName}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
