import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import {
  getPublishedBlogPosts,
  getPublishedBlogPostsByTag,
  getAllBlogTags,
} from "@/server/queries/pages";
import { localizePage } from "@/lib/utils/localize-page";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ tag?: string; page?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "blog" });
  return { title: t("title") };
}

function BlogPostSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border">
      <Skeleton className="h-48 w-full" />
      <div className="space-y-3 p-4">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </div>
  );
}

async function BlogList({
  locale,
  tag,
  page,
}: {
  locale: string;
  tag?: string;
  page: number;
}) {
  const t = await getTranslations({ locale, namespace: "blog" });
  const limit = 9;
  const offset = (page - 1) * limit;

  const { items, total } = tag
    ? await getPublishedBlogPostsByTag(tag, limit, offset)
    : await getPublishedBlogPosts(limit, offset);

  const totalPages = Math.ceil(total / limit);

  if (items.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">{t("noPosts")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((post) => {
          const localized = localizePage(
            { ...post, translations: post.translations },
            locale,
          );
          return (
            <Link
              key={post.id}
              href={`/${locale}/blog/${post.slug}`}
              className="group overflow-hidden rounded-lg border transition-shadow hover:shadow-md"
            >
              {post.coverImageUrl && (
                <div className="relative h-48 overflow-hidden">
                  <Image
                    src={post.coverImageUrl}
                    alt={localized.title}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                </div>
              )}
              <div className="space-y-2 p-4">
                {post.tags && post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {post.tags.slice(0, 3).map((t) => (
                      <Badge key={t} variant="secondary" className="text-xs">
                        {t}
                      </Badge>
                    ))}
                  </div>
                )}
                <h2 className="line-clamp-2 text-lg leading-tight font-semibold group-hover:underline">
                  {localized.title}
                </h2>
                {localized.excerpt && (
                  <p className="text-muted-foreground line-clamp-3 text-sm">
                    {localized.excerpt}
                  </p>
                )}
                <p className="text-muted-foreground text-xs">
                  {post.publishedAt
                    ? new Date(post.publishedAt).toLocaleDateString(locale, {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : ""}
                </p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {page > 1 && (
            <Button variant="outline" asChild>
              <Link href={`/${locale}/blog?page=${page - 1}${tag ? `&tag=${tag}` : ""}`}>
                {t("previous")}
              </Link>
            </Button>
          )}
          <span className="text-muted-foreground text-sm">
            {page} / {totalPages}
          </span>
          {page < totalPages && (
            <Button variant="outline" asChild>
              <Link href={`/${locale}/blog?page=${page + 1}${tag ? `&tag=${tag}` : ""}`}>
                {t("next")}
              </Link>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

async function TagCloud({ locale, activeTag }: { locale: string; activeTag?: string }) {
  const t = await getTranslations({ locale, namespace: "blog" });
  const tags = await getAllBlogTags();
  if (tags.length === 0) return null;

  return (
    <div className="space-y-2">
      <h2 className="text-sm font-medium tracking-wider uppercase">{t("tags")}</h2>
      <div className="flex flex-wrap gap-2">
        <Button variant={!activeTag ? "default" : "outline"} size="sm" asChild>
          <Link href={`/${locale}/blog`}>{t("allPosts")}</Link>
        </Button>
        {tags.map((tag) => (
          <Button
            key={tag}
            variant={activeTag === tag ? "default" : "outline"}
            size="sm"
            asChild
          >
            <Link href={`/${locale}/blog?tag=${encodeURIComponent(tag)}`}>{tag}</Link>
          </Button>
        ))}
      </div>
    </div>
  );
}

export default async function BlogPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const sp = await searchParams;
  const t = await getTranslations({ locale, namespace: "blog" });
  const page = parseInt(sp.page ?? "1");
  const tag = sp.tag;

  return (
    <div className="container mx-auto max-w-6xl space-y-8 px-4 py-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
      </div>

      <Suspense fallback={<Skeleton className="h-10 w-full" />}>
        <TagCloud locale={locale} activeTag={tag} />
      </Suspense>

      <Suspense
        fallback={
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <BlogPostSkeleton key={i} />
            ))}
          </div>
        }
      >
        <BlogList locale={locale} tag={tag} page={page} />
      </Suspense>
    </div>
  );
}
