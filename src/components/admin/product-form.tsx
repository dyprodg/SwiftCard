"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
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
import type {
  ProductWithRelations,
  Category,
  ProductImage,
  ProductVariant,
} from "@/types";
import { useState, useTransition } from "react";

type ProductFormProps = {
  product?: ProductWithRelations;
  categories: Category[];
};

export function ProductForm({ product, categories }: ProductFormProps) {
  const router = useRouter();
  const locale = useLocale();
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
          savedProduct = await createProduct(data);
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

        toast.success(isEditing ? "Product updated" : "Product created");
        router.push(`/${locale}/admin/products`);
      } catch {
        toast.error("Something went wrong");
      }
    });
  }

  function addVariant() {
    setVariants([
      ...variants,
      {
        sku: "",
        priceAdjustment: 0,
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
    value: string | number | boolean,
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
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Classic T-Shirt" {...field} />
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
                    <FormLabel>Slug</FormLabel>
                    <FormControl>
                      <Input placeholder="auto-generated from name" {...field} />
                    </FormControl>
                    <FormDescription>
                      Leave empty to auto-generate from name
                    </FormDescription>
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
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Describe the product..." rows={4} {...field} />
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
                    <FormLabel>Base Price (Rappen)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormDescription>
                      {field.value > 0
                        ? formatPrice(field.value)
                        : "Enter price in Rappen (cents)"}
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
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="DRAFT">Draft</SelectItem>
                        <SelectItem value="ACTIVE">Active</SelectItem>
                        <SelectItem value="ARCHIVED">Archived</SelectItem>
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
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
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
                  <FormLabel className="!mt-0">Featured Product</FormLabel>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Images */}
        <Card>
          <CardHeader>
            <CardTitle>Images</CardTitle>
          </CardHeader>
          <CardContent>
            <ImageUpload images={images} onChange={setImages} />
          </CardContent>
        </Card>

        {/* Variants */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Variants</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={addVariant}>
              <Plus className="mr-1 h-4 w-4" />
              Add Variant
            </Button>
          </CardHeader>
          <CardContent>
            {variants.length === 0 ? (
              <p className="text-muted-foreground py-4 text-center text-sm">
                No variants. Click &quot;Add Variant&quot; to add size, color, or material
                options.
              </p>
            ) : (
              <div className="space-y-4">
                {variants.map((variant, index) => (
                  <div key={index}>
                    {index > 0 && <Separator className="mb-4" />}
                    <div className="grid gap-3 sm:grid-cols-6">
                      <div>
                        <label className="text-sm font-medium">SKU *</label>
                        <Input
                          value={variant.sku}
                          onChange={(e) =>
                            updateVariantField(index, "sku", e.target.value)
                          }
                          placeholder="SKU-001"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Size</label>
                        <Input
                          value={variant.size ?? ""}
                          onChange={(e) =>
                            updateVariantField(index, "size", e.target.value)
                          }
                          placeholder="M"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Color</label>
                        <Input
                          value={variant.color ?? ""}
                          onChange={(e) =>
                            updateVariantField(index, "color", e.target.value)
                          }
                          placeholder="Black"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Price +/- (Rp.)</label>
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
                        <label className="text-sm font-medium">Stock</label>
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
            <CardTitle>SEO</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="metaTitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Meta Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Page title for search engines"
                      maxLength={60}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    {field.value?.length ?? 0}/60 characters
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
                  <FormLabel>Meta Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Brief description for search engines"
                      maxLength={160}
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    {field.value?.length ?? 0}/160 characters
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
            {isEditing ? "Update Product" : "Create Product"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}
