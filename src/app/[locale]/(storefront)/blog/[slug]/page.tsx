import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { getPublishedPageBySlug } from "@/server/queries/pages";
import { localizePage } from "@/lib/utils/localize-page";
import { generateArticleJsonLd } from "@/lib/seo/json-ld";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const post = await getPublishedPageBySlug(slug);
  if (!post || post.type !== "BLOG") return {};

  const localized = localizePage(post, locale);
  return {
    title: localized.metaTitle ?? localized.title,
    description: localized.metaDescription ?? localized.excerpt ?? undefined,
    openGraph: {
      title: localized.metaTitle ?? localized.title,
      description: localized.metaDescription ?? localized.excerpt ?? undefined,
      images: post.coverImageUrl ? [{ url: post.coverImageUrl }] : [],
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { locale, slug } = await params;
  const post = await getPublishedPageBySlug(slug);
  if (!post || post.type !== "BLOG") notFound();

  const t = await getTranslations({ locale, namespace: "blog" });
  const localized = localizePage(post, locale);

  const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const jsonLd = generateArticleJsonLd(
    {
      title: localized.title,
      excerpt: localized.excerpt,
      coverImageUrl: post.coverImageUrl,
      publishedAt: post.publishedAt,
      updatedAt: post.updatedAt,
      slug: post.slug,
    },
    locale,
    APP_URL,
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <article className="container mx-auto max-w-3xl px-4 py-10">
        {/* Back link */}
        <Button variant="ghost" size="sm" asChild className="mb-6 -ml-2">
          <Link href={`/${locale}/blog`}>
            <ChevronLeft className="mr-1 h-4 w-4" />
            {t("backToBlog")}
          </Link>
        </Button>

        {/* Cover image */}
        {post.coverImageUrl && (
          <div className="relative mb-8 h-64 overflow-hidden rounded-xl sm:h-80 md:h-96">
            <Image
              src={post.coverImageUrl}
              alt={localized.title}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 768px) 100vw, 768px"
            />
          </div>
        )}

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <Link key={tag} href={`/${locale}/blog?tag=${encodeURIComponent(tag)}`}>
                <Badge variant="secondary">{tag}</Badge>
              </Link>
            ))}
          </div>
        )}

        {/* Title */}
        <h1 className="mb-3 text-3xl font-bold tracking-tight md:text-4xl">
          {localized.title}
        </h1>

        {/* Date */}
        {post.publishedAt && (
          <p className="text-muted-foreground mb-8 text-sm">
            {t("publishedAt")}{" "}
            {new Date(post.publishedAt).toLocaleDateString(locale, {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        )}

        {/* Content */}
        <div
          className="prose prose-neutral dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: localized.content ?? "" }}
        />
      </article>
    </>
  );
}
