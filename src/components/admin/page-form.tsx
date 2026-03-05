"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import { createPage, updatePage, deletePage } from "@/server/actions/pages";
import { pageFormSchema, type PageFormValues } from "@/lib/validations/page";
import { slugify } from "@/lib/utils/slugify";
import { RichTextEditor } from "./rich-text-editor";
import type { PageWithTranslations } from "@/types";

const LOCALES = ["de", "en"] as const;

type PageFormProps = {
  initialData?: PageWithTranslations;
};

export function PageForm({ initialData }: PageFormProps) {
  const locale = useLocale();
  const t = useTranslations("admin.pages");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isDeleting, startDeleting] = useTransition();
  const isEditing = !!initialData;

  const form = useForm<PageFormValues>({
    resolver: zodResolver(pageFormSchema),
    defaultValues: {
      type: initialData?.type ?? "PAGE",
      title: initialData?.title ?? "",
      slug: initialData?.slug ?? "",
      status: initialData?.status ?? "DRAFT",
      content: initialData?.content ?? "",
      excerpt: initialData?.excerpt ?? "",
      coverImageUrl: initialData?.coverImageUrl ?? "",
      metaTitle: initialData?.metaTitle ?? "",
      metaDescription: initialData?.metaDescription ?? "",
      tags: initialData?.tags ?? [],
      translations: LOCALES.map((loc) => {
        const existing = initialData?.translations.find((t) => t.locale === loc);
        return {
          locale: loc,
          title: existing?.title ?? "",
          content: existing?.content ?? "",
          excerpt: existing?.excerpt ?? "",
          metaTitle: existing?.metaTitle ?? "",
          metaDescription: existing?.metaDescription ?? "",
        };
      }),
    },
  });

  const pageType = form.watch("type");

  function onTitleBlur() {
    const title = form.getValues("title");
    const slug = form.getValues("slug");
    if (!slug && title) {
      form.setValue("slug", slugify(title));
    }
  }

  async function onSubmit(values: PageFormValues) {
    startTransition(async () => {
      try {
        if (isEditing) {
          await updatePage({ id: initialData!.id, ...values });
          toast.success(t("updateSuccess"));
        } else {
          await createPage(values);
          toast.success(t("createSuccess"));
          router.push(`/${locale}/admin/pages`);
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : t("error"));
      }
    });
  }

  async function handleDelete() {
    if (!initialData) return;
    startDeleting(async () => {
      try {
        await deletePage(initialData.id);
        toast.success(t("deleteSuccess"));
        router.push(`/${locale}/admin/pages`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : t("error"));
      }
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">
            {isEditing
              ? t("editTitle")
              : pageType === "BLOG"
                ? t("createPost")
                : t("createPage")}
          </h1>
          <div className="flex items-center gap-2">
            {isEditing && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" disabled={isDeleting}>
                    {isDeleting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="mr-2 h-4 w-4" />
                    )}
                    {t("delete")}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t("deleteConfirmTitle")}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {t("deleteConfirmDescription")}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>
                      {t("delete")}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("save")}
            </Button>
          </div>
        </div>

        <Tabs defaultValue="content">
          <TabsList>
            <TabsTrigger value="content">{t("tabContent")}</TabsTrigger>
            <TabsTrigger value="meta">{t("tabSEO")}</TabsTrigger>
            <TabsTrigger value="translations">{t("tabTranslations")}</TabsTrigger>
          </TabsList>

          {/* ───── Content Tab ───── */}
          <TabsContent value="content" className="space-y-4 pt-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* Type */}
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("type")}</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={isEditing}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="PAGE">{t("typePage")}</SelectItem>
                        <SelectItem value="BLOG">{t("typeBlog")}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Status */}
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("status")}</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="DRAFT">{t("statusDraft")}</SelectItem>
                        <SelectItem value="PUBLISHED">{t("statusPublished")}</SelectItem>
                        <SelectItem value="ARCHIVED">{t("statusArchived")}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("title")}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      onBlur={onTitleBlur}
                      placeholder={t("titlePlaceholder")}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Slug */}
            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("slug")}</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="my-page-slug" />
                  </FormControl>
                  <FormDescription>{t("slugDescription")}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Content */}
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("content")}</FormLabel>
                  <FormControl>
                    <RichTextEditor
                      value={field.value}
                      onChange={field.onChange}
                      placeholder={t("contentPlaceholder")}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Excerpt — blog only */}
            {pageType === "BLOG" && (
              <FormField
                control={form.control}
                name="excerpt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("excerpt")}</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        value={field.value ?? ""}
                        placeholder={t("excerptPlaceholder")}
                        rows={3}
                      />
                    </FormControl>
                    <FormDescription>{t("excerptDescription")}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Cover Image — blog only */}
            {pageType === "BLOG" && (
              <FormField
                control={form.control}
                name="coverImageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("coverImage")}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value ?? ""}
                        placeholder="https://..."
                      />
                    </FormControl>
                    <FormDescription>{t("coverImageDescription")}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Tags */}
            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("tags")}</FormLabel>
                  <FormControl>
                    <Input
                      value={field.value.join(", ")}
                      onChange={(e) => {
                        const tags = e.target.value
                          .split(",")
                          .map((s) => s.trim())
                          .filter(Boolean);
                        field.onChange(tags);
                      }}
                      placeholder={t("tagsPlaceholder")}
                    />
                  </FormControl>
                  <FormDescription>{t("tagsDescription")}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>

          {/* ───── SEO Tab ───── */}
          <TabsContent value="meta" className="space-y-4 pt-4">
            <Card>
              <CardHeader>
                <CardTitle>{t("seoTitle")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="metaTitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("metaTitle")}</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="metaDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("metaDescription")}</FormLabel>
                      <FormControl>
                        <Textarea {...field} value={field.value ?? ""} rows={3} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* ───── Translations Tab ───── */}
          <TabsContent value="translations" className="space-y-4 pt-4">
            {LOCALES.map((loc, idx) => (
              <Card key={loc}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <span className="bg-muted rounded px-2 py-0.5 font-mono text-xs uppercase">
                      {loc}
                    </span>
                    {t("translationFor", { locale: loc.toUpperCase() })}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name={`translations.${idx}.title`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("title")}</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`translations.${idx}.content`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("content")}</FormLabel>
                        <FormControl>
                          <RichTextEditor
                            value={field.value ?? ""}
                            onChange={field.onChange}
                            placeholder={t("contentPlaceholder")}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {pageType === "BLOG" && (
                    <FormField
                      control={form.control}
                      name={`translations.${idx}.excerpt`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("excerpt")}</FormLabel>
                          <FormControl>
                            <Textarea {...field} value={field.value ?? ""} rows={2} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name={`translations.${idx}.metaTitle`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("metaTitle")}</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value ?? ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`translations.${idx}.metaDescription`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("metaDescription")}</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value ?? ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </form>
    </Form>
  );
}
