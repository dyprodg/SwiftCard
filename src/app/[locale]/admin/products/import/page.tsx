import { getTranslations } from "next-intl/server";
import { CsvImportForm } from "@/components/admin/products/csv-import-form";

export default async function ImportProductsPage() {
  const t = await getTranslations("admin.csvImport");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>
      <CsvImportForm />
    </div>
  );
}
