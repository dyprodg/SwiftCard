import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getPageById } from "@/server/queries/pages";
import { PageForm } from "@/components/admin/page-form";

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

export default async function EditPagePage({ params }: Props) {
  const { id } = await params;
  const page = await getPageById(id);
  if (!page) notFound();

  return (
    <div className="mx-auto max-w-4xl">
      <PageForm initialData={page} />
    </div>
  );
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const [page, t] = await Promise.all([getPageById(id), getTranslations("admin.pages")]);
  return {
    title: page ? `${t("editTitle")}: ${page.title}` : t("editTitle"),
  };
}
