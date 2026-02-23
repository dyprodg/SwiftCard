import { getTranslations } from "next-intl/server";
import { db } from "@/db";
import { products, categories } from "@/db/schema";
import { eq } from "drizzle-orm";
import { DiscountForm } from "@/components/admin/discount-form";

export default async function NewDiscountPage() {
  const t = await getTranslations("admin.discounts");

  const [allProducts, allCategories] = await Promise.all([
    db
      .select({ id: products.id, name: products.name })
      .from(products)
      .where(eq(products.status, "ACTIVE")),
    db.select({ id: categories.id, name: categories.name }).from(categories),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("createDiscount")}</h1>
        <p className="text-muted-foreground">{t("createDescription")}</p>
      </div>
      <DiscountForm products={allProducts} categories={allCategories} />
    </div>
  );
}
