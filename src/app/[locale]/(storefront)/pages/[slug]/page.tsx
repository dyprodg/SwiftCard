import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { getPublishedPageBySlug } from "@/server/queries/pages";
import { localizePage } from "@/lib/utils/localize-page";

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const page = await getPublishedPageBySlug(slug);
  if (!page || page.type !== "PAGE") return {};

  const localized = localizePage(page, locale);
  return {
    title: localized.metaTitle ?? localized.title,
    description: localized.metaDescription ?? undefined,
  };
}

export default async function CustomPagePage({ params }: Props) {
  const { locale, slug } = await params;
  const page = await getPublishedPageBySlug(slug);
  if (!page || page.type !== "PAGE") notFound();

  const localized = localizePage(page, locale);

  return (
    <div className="container mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-8 text-3xl font-bold tracking-tight">{localized.title}</h1>
      <div
        className="prose prose-neutral dark:prose-invert max-w-none"
        dangerouslySetInnerHTML={{ __html: localized.content ?? "" }}
      />
    </div>
  );
}
