import Link from "next/link";
import { Plus, FileText, BookOpen } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { getPages } from "@/server/queries/pages";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Props = {
  searchParams: Promise<{ page?: string; status?: string; tab?: string }>;
  params: Promise<{ locale: string }>;
};

const STATUS_VARIANT = {
  PUBLISHED: "default",
  DRAFT: "secondary",
  ARCHIVED: "outline",
} as const;

async function PagesTable({
  type,
  locale,
  page,
  status,
}: {
  type: "PAGE" | "BLOG";
  locale: string;
  page: number;
  status?: string;
}) {
  const t = await getTranslations("admin.pages");
  const pageSize = 20;

  const { items, total } = await getPages({
    type,
    status: status as "DRAFT" | "PUBLISHED" | "ARCHIVED" | undefined,
    limit: pageSize,
    offset: (page - 1) * pageSize,
  });

  const totalPages = Math.ceil(total / pageSize);
  const tabParam = type === "BLOG" ? "blog" : "pages";

  return (
    <div className="space-y-4">
      {/* Status filters */}
      <div className="flex flex-wrap items-center gap-2">
        <Button variant={!status ? "default" : "outline"} size="sm" asChild>
          <Link href={`/${locale}/admin/pages?tab=${tabParam}`}>{t("all")}</Link>
        </Button>
        {(["PUBLISHED", "DRAFT", "ARCHIVED"] as const).map((s) => (
          <Button
            key={s}
            variant={status === s ? "default" : "outline"}
            size="sm"
            asChild
          >
            <Link href={`/${locale}/admin/pages?tab=${tabParam}&status=${s}`}>
              {t(s.toLowerCase() as "draft" | "published" | "archived")}
            </Link>
          </Button>
        ))}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("titleCol")}</TableHead>
              <TableHead>{t("slugCol")}</TableHead>
              <TableHead>{t("statusCol")}</TableHead>
              <TableHead>{t("publishedAtCol")}</TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  {t("noPages")}
                </TableCell>
              </TableRow>
            ) : (
              items.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.title}</TableCell>
                  <TableCell className="text-muted-foreground font-mono text-xs">
                    {p.slug}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={STATUS_VARIANT[p.status as keyof typeof STATUS_VARIANT]}
                    >
                      {t(p.status.toLowerCase() as "draft" | "published" | "archived")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {p.publishedAt ? new Date(p.publishedAt).toLocaleDateString() : "—"}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/${locale}/admin/pages/${p.id}/edit`}>
                        {t("edit")}
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-sm">
            {t("page")} {page} {t("of")} {totalPages}
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <Button variant="outline" size="sm" asChild>
                <Link
                  href={`/${locale}/admin/pages?tab=${tabParam}&page=${page - 1}${status ? `&status=${status}` : ""}`}
                >
                  {t("previous")}
                </Link>
              </Button>
            )}
            {page < totalPages && (
              <Button variant="outline" size="sm" asChild>
                <Link
                  href={`/${locale}/admin/pages?tab=${tabParam}&page=${page + 1}${status ? `&status=${status}` : ""}`}
                >
                  {t("next")}
                </Link>
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default async function PagesAdminPage({ searchParams, params }: Props) {
  const { locale } = await params;
  const sp = await searchParams;
  const t = await getTranslations("admin.pages");
  const page = parseInt(sp.page ?? "1");
  const tab = sp.tab ?? "pages";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground">{t("description")}</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href={`/${locale}/admin/pages/new?type=BLOG`}>
              <BookOpen className="mr-2 h-4 w-4" />
              {t("createPost")}
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/${locale}/admin/pages/new?type=PAGE`}>
              <Plus className="mr-2 h-4 w-4" />
              {t("createPage")}
            </Link>
          </Button>
        </div>
      </div>

      <Tabs value={tab}>
        <TabsList>
          <TabsTrigger value="pages" asChild>
            <Link href={`/${locale}/admin/pages?tab=pages`}>
              <FileText className="mr-2 h-4 w-4" />
              {t("customPages")}
            </Link>
          </TabsTrigger>
          <TabsTrigger value="blog" asChild>
            <Link href={`/${locale}/admin/pages?tab=blog`}>
              <BookOpen className="mr-2 h-4 w-4" />
              {t("blogPosts")}
            </Link>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pages" className="pt-4">
          <PagesTable type="PAGE" locale={locale} page={page} status={sp.status} />
        </TabsContent>
        <TabsContent value="blog" className="pt-4">
          <PagesTable type="BLOG" locale={locale} page={page} status={sp.status} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
