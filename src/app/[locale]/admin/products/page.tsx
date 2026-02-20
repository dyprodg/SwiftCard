import Link from "next/link";
import Image from "next/image";
import { Plus } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { getProducts } from "@/server/queries/products";
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
  searchParams: Promise<{ page?: string; search?: string; status?: string }>;
  params: Promise<{ locale: string }>;
};

const STATUS_VARIANT = {
  ACTIVE: "default",
  DRAFT: "secondary",
  ARCHIVED: "outline",
} as const;

export default async function ProductsPage({ searchParams, params }: Props) {
  const { locale } = await params;
  const sp = await searchParams;
  const t = await getTranslations("admin.products");
  const page = parseInt(sp.page ?? "1");
  const pageSize = 20;

  const { items, total } = await getProducts({
    status: sp.status as "DRAFT" | "ACTIVE" | "ARCHIVED" | undefined,
    search: sp.search,
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
          <Link href={`/${locale}/admin/products/new`}>
            <Plus className="mr-2 h-4 w-4" />
            {t("addProduct")}
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        <Button variant={!sp.status ? "default" : "outline"} size="sm" asChild>
          <Link href={`/${locale}/admin/products`}>{t("all")}</Link>
        </Button>
        {(["ACTIVE", "DRAFT", "ARCHIVED"] as const).map((status) => (
          <Button
            key={status}
            variant={sp.status === status ? "default" : "outline"}
            size="sm"
            asChild
          >
            <Link href={`/${locale}/admin/products?status=${status}`}>
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
              <TableHead>{t("category")}</TableHead>
              <TableHead className="text-right">{t("price")}</TableHead>
              <TableHead className="text-right">{t("variantsCol")}</TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  {t("noProducts")}
                </TableCell>
              </TableRow>
            ) : (
              items.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    {product.images[0] ? (
                      <div className="relative h-10 w-10 overflow-hidden rounded">
                        <Image
                          src={product.images[0].url}
                          alt={product.images[0].alt ?? product.name}
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
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        STATUS_VARIANT[product.status as keyof typeof STATUS_VARIANT]
                      }
                    >
                      {t(product.status.toLowerCase() as "active" | "draft" | "archived")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {product.category?.name ?? (
                      <span className="text-muted-foreground">{"\u2014"}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatPrice(product.basePrice)}
                  </TableCell>
                  <TableCell className="text-right">{product.variants.length}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/${locale}/admin/products/${product.id}/edit`}>
                        {t("editProduct")}
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
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
                  href={`/${locale}/admin/products?page=${page - 1}${sp.status ? `&status=${sp.status}` : ""}`}
                >
                  {t("previous")}
                </Link>
              </Button>
            )}
            {page < totalPages && (
              <Button variant="outline" size="sm" asChild>
                <Link
                  href={`/${locale}/admin/products?page=${page + 1}${sp.status ? `&status=${sp.status}` : ""}`}
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
