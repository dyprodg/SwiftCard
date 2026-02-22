import { getTranslations } from "next-intl/server";
import { getCategories } from "@/server/queries/categories";
import { ProductForm } from "@/components/admin/product-form";

export default async function NewProductPage() {
  const t = await getTranslations("admin.products");
  const categories = await getCategories();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("createProduct")}</h1>
        <p className="text-muted-foreground">{t("createDescription")}</p>
      </div>
      <ProductForm categories={categories} />
    </div>
  );
}
