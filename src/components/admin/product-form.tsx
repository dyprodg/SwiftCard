"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { productFormSchema, type ProductFormValues } from "@/lib/validations/product";
import {
  createProduct,
  updateProduct,
  addProductImage,
  deleteProductImage,
  createVariant,
  deleteVariant,
} from "@/server/actions/products";

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
import { Switch } from "@/components/ui/switch";
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
import { Separator } from "@/components/ui/separator";
import { ImageUpload } from "./image-upload";
import { formatPrice } from "@/lib/utils/format-price";
import type { ProductWithRelations, Category } from "@/types";
import { useState, useTransition } from "react";

type ProductFormProps = {
  product?: ProductWithRelations;
  categories: Category[];
};

export function ProductForm({ product, categories }: ProductFormProps) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("admin.products");
  const [isPending, startTransition] = useTransition();
  const [images, setImages] = useState<{ url: string; alt?: string }[]>(
    product?.images?.map((img) => ({ url: img.url, alt: img.alt ?? undefined })) ?? [],
  );
  const [variants, setVariants] = useState<
    Array<{
      id?: string;
      sku: string;
      size?: string;
      color?: string;
      material?: string;
      priceAdjustment: number;
      weight?: number | null;
      stock: number;
      isAvailable: boolean;
    }>
  >(
    product?.variants?.map((v) => ({
      id: v.id,
      sku: v.sku,
      size: v.size ?? undefined,
      color: v.color ?? undefined,
      material: v.material ?? undefined,
      priceAdjustment: v.priceAdjustment,
      weight: v.weight,
      stock: v.stock,
      isAvailable: v.isAvailable,
    })) ?? [],
  );

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: product?.name ?? "",
      slug: product?.slug ?? "",
      description: product?.description ?? "",
      basePrice: product?.basePrice ?? 0,
      metaTitle: product?.metaTitle ?? "",
      metaDescription: product?.metaDescription ?? "",
      status: product?.status ?? "DRAFT",
      featured: product?.featured ?? false,
      categoryId: product?.categoryId ?? undefined,
    },
  });

  const isEditing = !!product;

  async function onSubmit(data: ProductFormValues) {
    startTransition(async () => {
      try {
        let savedProduct: { id: string };

        if (isEditing) {
          savedProduct = await updateProduct({ ...data, id: product!.id });
        } else {
          savedProduct = (await createProduct(data)) as { id: string };
        }

        // Handle images
        if (savedProduct) {
          // Delete removed images
          if (isEditing && product?.images) {
            const currentUrls = new Set(images.map((img) => img.url));
            for (const existingImg of product.images) {
              if (!currentUrls.has(existingImg.url)) {
                await deleteProductImage(existingImg.id);
              }
            }
          }

          // Add new images
          const existingUrls = new Set(product?.images?.map((img) => img.url) ?? []);
          for (const img of images) {
            if (!existingUrls.has(img.url)) {
              await addProductImage(savedProduct.id, img.url, img.alt);
            }
          }

          // Handle variants
          if (isEditing && product?.variants) {
            const currentSkus = new Set(variants.map((v) => v.sku));
            for (const existingVar of product.variants) {
              if (!currentSkus.has(existingVar.sku)) {
                await deleteVariant(existingVar.id);
              }
            }
          }

          // Add new variants
          const existingSkus = new Set(product?.variants?.map((v) => v.sku) ?? []);
          for (const variant of variants) {
            if (!existingSkus.has(variant.sku)) {
              await createVariant({
                ...variant,
                productId: savedProduct.id,
              });
            }
          }
        }

        toast.success(isEditing ? t("productUpdated") : t("productCreated"));
        router.push(`/${locale}/admin/products`);
      } catch {
        toast.error(t("productError"));
      }
    });
  }

  function addVariant() {
    setVariants([
      ...variants,
      {
        sku: "",
        priceAdjustment: 0,
        weight: null,
        stock: 0,
        isAvailable: true,
      },
    ]);
  }

  function removeVariant(index: number) {
    setVariants(variants.filter((_, i) => i !== index));
  }

  function updateVariantField(
    index: number,
    field: string,
    value: string | number | boolean | null,
  ) {
    const updated = [...variants];
    updated[index] = { ...updated[index], [field]: value };
    setVariants(updated);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>{t("basicInfo")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("productName")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("productNamePlaceholder")} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("slug")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("slugPlaceholder")} {...field} />
                    </FormControl>
                    <FormDescription>{t("slugHint")}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("description")}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t("descriptionPlaceholder")}
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="basePrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("basePrice")}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormDescription>
                      {field.value > 0 ? formatPrice(field.value) : t("basePriceHint")}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("statusCol")}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("selectStatus")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="DRAFT">{t("draft")}</SelectItem>
                        <SelectItem value="ACTIVE">{t("active")}</SelectItem>
                        <SelectItem value="ARCHIVED">{t("archived")}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("category")}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("selectCategory")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="featured"
              render={({ field }) => (
                <FormItem className="flex items-center gap-3">
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <FormLabel className="!mt-0">{t("featuredProduct")}</FormLabel>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Images */}
        <Card>
          <CardHeader>
            <CardTitle>{t("images")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ImageUpload images={images} onChange={setImages} />
          </CardContent>
        </Card>

        {/* Variants */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{t("variantsTitle")}</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={addVariant}>
              <Plus className="mr-1 h-4 w-4" />
              {t("addVariant")}
            </Button>
          </CardHeader>
          <CardContent>
            {variants.length === 0 ? (
              <p className="text-muted-foreground py-4 text-center text-sm">
                {t("noVariants")}
              </p>
            ) : (
              <div className="space-y-4">
                {variants.map((variant, index) => (
                  <div key={index}>
                    {index > 0 && <Separator className="mb-4" />}
                    <div className="grid gap-3 sm:grid-cols-7">
                      <div>
                        <label className="text-sm font-medium">{t("skuLabel")}</label>
                        <Input
                          value={variant.sku}
                          onChange={(e) =>
                            updateVariantField(index, "sku", e.target.value)
                          }
                          placeholder={t("skuPlaceholder")}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">{t("sizeLabel")}</label>
                        <Input
                          value={variant.size ?? ""}
                          onChange={(e) =>
                            updateVariantField(index, "size", e.target.value)
                          }
                          placeholder={t("sizePlaceholder")}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">{t("colorLabel")}</label>
                        <Input
                          value={variant.color ?? ""}
                          onChange={(e) =>
                            updateVariantField(index, "color", e.target.value)
                          }
                          placeholder={t("colorPlaceholder")}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">
                          {t("priceAdjustment")}
                        </label>
                        <Input
                          type="number"
                          value={variant.priceAdjustment}
                          onChange={(e) =>
                            updateVariantField(
                              index,
                              "priceAdjustment",
                              parseInt(e.target.value) || 0,
                            )
                          }
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">{t("weightLabel")}</label>
                        <Input
                          type="number"
                          min={0}
                          value={variant.weight ?? ""}
                          onChange={(e) =>
                            updateVariantField(
                              index,
                              "weight",
                              e.target.value ? parseInt(e.target.value) : null,
                            )
                          }
                          placeholder="g"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">{t("stockLabel")}</label>
                        <Input
                          type="number"
                          min={0}
                          value={variant.stock}
                          onChange={(e) =>
                            updateVariantField(
                              index,
                              "stock",
                              parseInt(e.target.value) || 0,
                            )
                          }
                        />
                      </div>
                      <div className="flex items-end">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeVariant(index)}
                        >
                          <Trash2 className="text-destructive h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* SEO */}
        <Card>
          <CardHeader>
            <CardTitle>{t("seo")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="metaTitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("metaTitle")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("metaTitlePlaceholder")}
                      maxLength={60}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    {t("metaTitleCount", { count: field.value?.length ?? 0 })}
                  </FormDescription>
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
                    <Textarea
                      placeholder={t("metaDescriptionPlaceholder")}
                      maxLength={160}
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    {t("metaDescriptionCount", { count: field.value?.length ?? 0 })}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex items-center gap-4">
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? t("updateProduct") : t("createProduct")}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            {t("cancel")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
