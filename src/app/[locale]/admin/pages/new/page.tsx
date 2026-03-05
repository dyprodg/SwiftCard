import { getTranslations } from "next-intl/server";
import { PageForm } from "@/components/admin/page-form";

type Props = {
  searchParams: Promise<{ type?: string }>;
};

export default async function NewPagePage({ searchParams }: Props) {
  const sp = await searchParams;
  const t = await getTranslations("admin.pages");
  const type = sp.type === "BLOG" ? "BLOG" : "PAGE";

  return (
    <div className="mx-auto max-w-4xl">
      <PageForm key={type} initialData={undefined} />
    </div>
  );
}

export async function generateMetadata({ searchParams }: Props) {
  const sp = await searchParams;
  const t = await getTranslations("admin.pages");
  const type = sp.type === "BLOG" ? "BLOG" : "PAGE";
  return {
    title: type === "BLOG" ? t("createPost") : t("createPage"),
  };
}
