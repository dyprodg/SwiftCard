"use client";

import { useState, useCallback, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Loader2, Plus, Trash2, Search, GripVertical } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
import {
  createBundle,
  updateBundle,
  deleteBundle,
  searchProductsForBundle,
} from "@/server/actions/bundles";
import { bundleFormSchema, type BundleFormValues } from "@/lib/validations/bundle";
import { calculateBundleSavings } from "@/lib/utils/bundle-calculator";
import { formatPrice } from "@/lib/utils/format-price";
import { slugify } from "@/lib/utils/slugify";
import type { BundleWithItems, Product, ProductImage, ProductVariant } from "@/types";

type SearchProduct = Product & {
  images: ProductImage[];
  variants: ProductVariant[];
};

type BundleItemDraft = {
  productId: string;
  variantId: string | null;
  quantity: number;
  position: number;
  // Display info
  productName: string;
  variantName: string | null;
  unitPrice: number;
  imageUrl: string | null;
};

type BundleFormProps = {
  bundle?: BundleWithItems;
};

export function BundleForm({ bundle }: BundleFormProps) {
  const t = useTranslations("admin.bundles");
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Product search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchProduct[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Bundle items state
  const [items, setItems] = useState<BundleItemDraft[]>(() => {
    if (!bundle) return [];
    return bundle.items.map((item) => ({
      productId: item.productId,
      variantId: item.variantId,
      quantity: item.quantity,
      position: item.position,
      productName: item.product.name,
      variantName: item.variant
        ? [item.variant.size, item.variant.color, item.variant.material]
            .filter(Boolean)
            .join(" / ")
        : null,
      unitPrice: item.product.basePrice + (item.variant?.priceAdjustment ?? 0),
      imageUrl: item.product.images?.[0]?.url ?? null,
    }));
  });

  const form = useForm<BundleFormValues>({
    resolver: zodResolver(bundleFormSchema),
    defaultValues: {
      name: bundle?.name ?? "",
      slug: bundle?.slug ?? "",
      description: bundle?.description ?? "",
      bundlePrice: bundle?.bundlePrice ?? 0,
      status: (bundle?.status as "DRAFT" | "ACTIVE" | "ARCHIVED") ?? "DRAFT",
      featured: bundle?.featured ?? false,
      items:
        bundle?.items.map((item) => ({
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          position: item.position,
        })) ?? [],
      translations:
        bundle?.translations.map((t) => ({
          locale: t.locale,
          name: t.name,
          description: t.description ?? undefined,
        })) ?? [],
    },
  });

  // Keep form items in sync with state
  const syncFormItems = useCallback(
    (newItems: BundleItemDraft[]) => {
      form.setValue(
        "items",
        newItems.map((item) => ({
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          position: item.position,
        })),
        { shouldValidate: true },
      );
    },
    [form],
  );

  // Auto-generate slug
  const name = form.watch("name");
  const handleNameBlur = () => {
    if (!form.getValues("slug")) {
      form.setValue("slug", slugify(name));
    }
  };

  // Search products
  const handleSearch = useCallback(async () => {
    if (searchQuery.trim().length < 2) return;
    setIsSearching(true);
    try {
      const results = await searchProductsForBundle(searchQuery);
      setSearchResults(results as SearchProduct[]);
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery]);

  // Add product to bundle
  const addItem = useCallback(
    (product: SearchProduct, variantId: string | null) => {
      const variant = variantId ? product.variants.find((v) => v.id === variantId) : null;
      const variantName = variant
        ? [variant.size, variant.color, variant.material].filter(Boolean).join(" / ")
        : null;

      const newItem: BundleItemDraft = {
        productId: product.id,
        variantId,
        quantity: 1,
        position: items.length,
        productName: product.name,
        variantName,
        unitPrice: product.basePrice + (variant?.priceAdjustment ?? 0),
        imageUrl: product.images?.[0]?.url ?? null,
      };

      const updated = [...items, newItem];
      setItems(updated);
      syncFormItems(updated);
      setSearchResults([]);
      setSearchQuery("");
    },
    [items, syncFormItems],
  );

  // Update item quantity
  const updateItemQuantity = useCallback(
    (index: number, quantity: number) => {
      const updated = items.map((item, i) =>
        i === index ? { ...item, quantity: Math.max(1, quantity) } : item,
      );
      setItems(updated);
      syncFormItems(updated);
    },
    [items, syncFormItems],
  );

  // Remove item
  const removeItem = useCallback(
    (index: number) => {
      const updated = items
        .filter((_, i) => i !== index)
        .map((item, i) => ({ ...item, position: i }));
      setItems(updated);
      syncFormItems(updated);
    },
    [items, syncFormItems],
  );

  // Calculate savings
  const bundlePrice = form.watch("bundlePrice") ?? 0;
  const { totalValue, savings, savingsPercent } = calculateBundleSavings(
    bundlePrice,
    items.map((i) => ({ unitPrice: i.unitPrice, quantity: i.quantity })),
  );

  // Submit
  async function onSubmit(data: BundleFormValues) {
    startTransition(async () => {
      try {
        if (bundle) {
          await updateBundle({ id: bundle.id, ...data });
          toast.success(t("updated"));
        } else {
          await createBundle(data);
          toast.success(t("created"));
        }
        router.push(`/${locale}/admin/bundles`);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : t("error"));
      }
    });
  }

  // Delete
  async function handleDelete() {
    if (!bundle) return;
    startTransition(async () => {
      try {
        await deleteBundle(bundle.id);
        toast.success(t("deleted"));
        router.push(`/${locale}/admin/bundles`);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : t("error"));
      }
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("basicInfo")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("name")}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder={t("namePlaceholder")}
                      onBlur={handleNameBlur}
                    />
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
                    <Input {...field} placeholder={t("slugPlaceholder")} />
                  </FormControl>
                  <FormDescription>{t("slugHint")}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("description")}</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder={t("descriptionPlaceholder")}
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("status")}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
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
                name="featured"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-3 pt-8">
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="!mt-0">{t("featured")}</FormLabel>
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Bundle Items */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("items")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search */}
            <div className="flex gap-2">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("searchProducts")}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSearch();
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleSearch}
                disabled={isSearching}
              >
                {isSearching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="max-h-[300px] overflow-auto rounded-md border">
                {searchResults.map((product) => (
                  <div key={product.id} className="border-b p-3 last:border-b-0">
                    <div className="flex items-center gap-3">
                      {product.images?.[0] && (
                        <div className="relative h-8 w-8 overflow-hidden rounded">
                          <Image
                            src={product.images[0].url}
                            alt={product.name}
                            fill
                            className="object-cover"
                            sizes="32px"
                          />
                        </div>
                      )}
                      <span className="flex-1 text-sm font-medium">{product.name}</span>
                      <span className="text-muted-foreground text-sm">
                        {formatPrice(product.basePrice)}
                      </span>
                    </div>
                    {product.variants.length > 0 ? (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {product.variants.map((variant) => (
                          <Button
                            key={variant.id}
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => addItem(product, variant.id)}
                          >
                            <Plus className="mr-1 h-3 w-3" />
                            {[variant.size, variant.color, variant.material]
                              .filter(Boolean)
                              .join(" / ") || variant.sku}
                          </Button>
                        ))}
                      </div>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="mt-2 h-7 text-xs"
                        onClick={() => addItem(product, null)}
                      >
                        <Plus className="mr-1 h-3 w-3" />
                        {t("addItem")}
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Item List */}
            {items.length === 0 ? (
              <p className="text-muted-foreground py-8 text-center text-sm">
                {t("noItems")}
              </p>
            ) : (
              <div className="space-y-2">
                {items.map((item, index) => (
                  <div
                    key={`${item.productId}-${item.variantId}-${index}`}
                    className="flex items-center gap-3 rounded-md border p-3"
                  >
                    <GripVertical className="text-muted-foreground h-4 w-4 shrink-0" />
                    {item.imageUrl && (
                      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded">
                        <Image
                          src={item.imageUrl}
                          alt={item.productName}
                          fill
                          className="object-cover"
                          sizes="40px"
                        />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{item.productName}</p>
                      {item.variantName && (
                        <p className="text-muted-foreground truncate text-xs">
                          {item.variantName}
                        </p>
                      )}
                    </div>
                    <span className="text-muted-foreground shrink-0 text-sm">
                      {formatPrice(item.unitPrice)}
                    </span>
                    <Input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) =>
                        updateItemQuantity(index, parseInt(e.target.value) || 1)
                      }
                      className="w-20 shrink-0"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {form.formState.errors.items && (
              <p className="text-destructive text-sm">
                {form.formState.errors.items.message}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Pricing */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("pricing")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-muted-foreground text-sm">{t("totalValue")}</p>
                <p className="text-lg font-semibold">{formatPrice(totalValue)}</p>
              </div>
              <FormField
                control={form.control}
                name="bundlePrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("bundlePrice")}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>{t("bundlePriceHint")}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div>
                <p className="text-muted-foreground text-sm">{t("savings")}</p>
                <p
                  className={`text-lg font-semibold ${savings > 0 ? "text-green-600" : ""}`}
                >
                  {savings > 0
                    ? `${formatPrice(savings)} (${savingsPercent}%)`
                    : "\u2014"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {bundle ? t("update") : t("create")}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/${locale}/admin/bundles`)}
          >
            {t("cancel")}
          </Button>
          {bundle && (
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={isPending}
              className="ml-auto"
            >
              {t("delete")}
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
}
