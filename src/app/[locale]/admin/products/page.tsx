import Link from "next/link";
import Image from "next/image";
import { Plus } from "lucide-react";

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
          <h1 className="text-2xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground">{total} products total</p>
        </div>
        <Button asChild>
          <Link href={`/${locale}/admin/products/new`}>
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        <Button variant={!sp.status ? "default" : "outline"} size="sm" asChild>
          <Link href={`/${locale}/admin/products`}>All</Link>
        </Button>
        {(["ACTIVE", "DRAFT", "ARCHIVED"] as const).map((status) => (
          <Button
            key={status}
            variant={sp.status === status ? "default" : "outline"}
            size="sm"
            asChild
          >
            <Link href={`/${locale}/admin/products?status=${status}`}>
              {status.charAt(0) + status.slice(1).toLowerCase()}
            </Link>
          </Button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">Image</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">Variants</TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  No products found.
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
                    <Badge variant={STATUS_VARIANT[product.status]}>
                      {product.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {product.category?.name ?? (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatPrice(product.basePrice)}
                  </TableCell>
                  <TableCell className="text-right">{product.variants.length}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/${locale}/admin/products/${product.id}/edit`}>
                        Edit
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
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <Button variant="outline" size="sm" asChild>
                <Link
                  href={`/${locale}/admin/products?page=${page - 1}${sp.status ? `&status=${sp.status}` : ""}`}
                >
                  Previous
                </Link>
              </Button>
            )}
            {page < totalPages && (
              <Button variant="outline" size="sm" asChild>
                <Link
                  href={`/${locale}/admin/products?page=${page + 1}${sp.status ? `&status=${sp.status}` : ""}`}
                >
                  Next
                </Link>
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
