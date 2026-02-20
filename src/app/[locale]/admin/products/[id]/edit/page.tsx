import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { getProductById } from "@/server/queries/products";
import { getCategories } from "@/server/queries/categories";
import { ProductForm } from "@/components/admin/product-form";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditProductPage({ params }: Props) {
  const { id } = await params;
  const t = await getTranslations("admin.products");
  const [product, categories] = await Promise.all([getProductById(id), getCategories()]);

  if (!product) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("editProduct")}</h1>
        <p className="text-muted-foreground">{product.name}</p>
      </div>
      <ProductForm product={product} categories={categories} />
    </div>
  );
}
