import Link from "next/link";
import Image from "next/image";
import { Plus } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { getBundles } from "@/server/queries/bundles";
import { calculateBundleSavings } from "@/lib/utils/bundle-calculator";
import { formatPrice } from "@/lib/utils/format-price";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Props = {
  searchParams: Promise<{ page?: string; status?: string }>;
  params: Promise<{ locale: string }>;
};

const STATUS_VARIANT = {
  ACTIVE: "default",
  DRAFT: "secondary",
  ARCHIVED: "outline",
} as const;

export default async function BundlesPage({ searchParams, params }: Props) {
  const { locale } = await params;
  const sp = await searchParams;
  const t = await getTranslations("admin.bundles");
  const page = parseInt(sp.page ?? "1");
  const pageSize = 20;

  const { items, total } = await getBundles({
    status: sp.status as "DRAFT" | "ACTIVE" | "ARCHIVED" | undefined,
    limit: pageSize,
    offset: (page - 1) * pageSize,
  });

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground">{t("totalCount", { count: total })}</p>
        </div>
        <Button asChild>
          <Link href={`/${locale}/admin/bundles/new`}>
            <Plus className="mr-2 h-4 w-4" />
            {t("create")}
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        <Button variant={!sp.status ? "default" : "outline"} size="sm" asChild>
          <Link href={`/${locale}/admin/bundles`}>{t("all")}</Link>
        </Button>
        {(["ACTIVE", "DRAFT", "ARCHIVED"] as const).map((status) => (
          <Button
            key={status}
            variant={sp.status === status ? "default" : "outline"}
            size="sm"
            asChild
          >
            <Link href={`/${locale}/admin/bundles?status=${status}`}>
              {t(status.toLowerCase() as "active" | "draft" | "archived")}
            </Link>
          </Button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">{t("image")}</TableHead>
              <TableHead>{t("name")}</TableHead>
              <TableHead>{t("statusCol")}</TableHead>
              <TableHead className="text-right">{t("bundlePrice")}</TableHead>
              <TableHead className="text-right">{t("savings")}</TableHead>
              <TableHead className="text-right">{t("itemsCol")}</TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  {t("noBundles")}
                </TableCell>
              </TableRow>
            ) : (
              items.map((bundle) => {
                const bundleItems = bundle.items.map((item) => ({
                  unitPrice:
                    item.product.basePrice + (item.variant?.priceAdjustment ?? 0),
                  quantity: item.quantity,
                }));
                const { savings, savingsPercent } = calculateBundleSavings(
                  bundle.bundlePrice,
                  bundleItems,
                );
                const firstImage = bundle.items[0]?.product?.images?.[0];

                return (
                  <TableRow key={bundle.id}>
                    <TableCell>
                      {firstImage ? (
                        <div className="relative h-10 w-10 overflow-hidden rounded">
                          <Image
                            src={firstImage.url}
                            alt={firstImage.alt ?? bundle.name}
                            fill
                            className="object-cover"
                            sizes="40px"
                          />
                        </div>
                      ) : (
                        <div className="bg-muted text-muted-foreground flex h-10 w-10 items-center justify-center rounded text-xs">
                          N/A
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{bundle.name}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          STATUS_VARIANT[bundle.status as keyof typeof STATUS_VARIANT]
                        }
                      >
                        {t(
                          bundle.status.toLowerCase() as "active" | "draft" | "archived",
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatPrice(bundle.bundlePrice)}
                    </TableCell>
                    <TableCell className="text-right">
                      {savings > 0 ? (
                        <span className="text-green-600">
                          {formatPrice(savings)} ({savingsPercent}%)
                        </span>
                      ) : (
                        <span className="text-muted-foreground">{"\u2014"}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">{bundle.items.length}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/${locale}/admin/bundles/${bundle.id}/edit`}>
                          {t("edit")}
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-sm">
            {t("page")} {page} {t("of")} {totalPages}
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <Button variant="outline" size="sm" asChild>
                <Link
                  href={`/${locale}/admin/bundles?page=${page - 1}${sp.status ? `&status=${sp.status}` : ""}`}
                >
                  {t("previous")}
                </Link>
              </Button>
            )}
            {page < totalPages && (
              <Button variant="outline" size="sm" asChild>
                <Link
                  href={`/${locale}/admin/bundles?page=${page + 1}${sp.status ? `&status=${sp.status}` : ""}`}
                >
                  {t("next")}
                </Link>
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
