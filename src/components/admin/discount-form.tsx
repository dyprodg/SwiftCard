"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { discountFormSchema, type DiscountFormValues } from "@/lib/validations/discount";
import { createDiscount, updateDiscount } from "@/server/actions/discounts";
import type { DiscountWithRelations, Product, Category } from "@/types";

type Props = {
  discount?: DiscountWithRelations;
  products: Pick<Product, "id" | "name">[];
  categories: Pick<Category, "id" | "name">[];
};

export function DiscountForm({ discount, products, categories }: Props) {
  const t = useTranslations("admin.discounts");
  const tc = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const initialScope =
    discount && (discount.products.length > 0 || discount.categories.length > 0)
      ? "specific"
      : "everything";
  const [appliesTo, setAppliesTo] = useState<"everything" | "specific">(initialScope);

  const form = useForm<DiscountFormValues>({
    resolver: zodResolver(discountFormSchema),
    defaultValues: {
      name: discount?.name ?? "",
      description: discount?.description ?? "",
      type: discount?.type ?? "PERCENTAGE",
      value: discount
        ? discount.type === "PERCENTAGE"
          ? discount.value / 100 // Show as user-friendly number
          : discount.value
        : 0,
      active: discount?.active ?? true,
      automatic: discount?.automatic ?? false,
      code: discount?.code ?? "",
      minOrderAmount: discount?.minOrderAmount ?? undefined,
      maxUses: discount?.maxUses ?? undefined,
      maxUsesPerCustomer: discount?.maxUsesPerCustomer ?? undefined,
      startsAt: discount?.startsAt
        ? new Date(discount.startsAt).toISOString().slice(0, 16)
        : undefined,
      expiresAt: discount?.expiresAt
        ? new Date(discount.expiresAt).toISOString().slice(0, 16)
        : undefined,
      productIds: discount?.products.map((p) => p.productId) ?? [],
      categoryIds: discount?.categories.map((c) => c.categoryId) ?? [],
    },
  });

  const watchType = form.watch("type");
  const watchAutomatic = form.watch("automatic");

  function onSubmit(values: DiscountFormValues) {
    startTransition(async () => {
      try {
        // Convert percentage from user-friendly number to basis points
        const serverValue =
          values.type === "PERCENTAGE"
            ? Math.round(values.value * 100)
            : values.type === "FREE_SHIPPING"
              ? 0
              : values.value;

        const payload = {
          ...values,
          value: serverValue,
          productIds: appliesTo === "everything" ? [] : values.productIds,
          categoryIds: appliesTo === "everything" ? [] : values.categoryIds,
        };

        if (discount) {
          await updateDiscount({ ...payload, id: discount.id });
          toast.success(t("discountUpdated"));
        } else {
          await createDiscount(payload);
          toast.success(t("discountCreated"));
        }
        router.push(`/${locale}/admin/discounts`);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : t("discountError"),
        );
      }
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>{t("basicInfo")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("name")}</FormLabel>
                  <FormControl>
                    <Input placeholder={t("namePlaceholder")} {...field} />
                  </FormControl>
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
                    <Textarea placeholder={t("descriptionPlaceholder")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="active"
              render={({ field }) => (
                <FormItem className="flex items-center gap-3">
                  <FormLabel>{t("activeLabel")}</FormLabel>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>{t("configuration")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("typeCol")}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="PERCENTAGE">{t("types.PERCENTAGE")}</SelectItem>
                      <SelectItem value="FIXED">{t("types.FIXED")}</SelectItem>
                      <SelectItem value="FREE_SHIPPING">
                        {t("types.FREE_SHIPPING")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {watchType !== "FREE_SHIPPING" && (
              <FormField
                control={form.control}
                name="value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {watchType === "PERCENTAGE" ? t("percentageValue") : t("fixedValue")}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        step={watchType === "PERCENTAGE" ? 0.01 : 1}
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>
                      {watchType === "PERCENTAGE"
                        ? t("percentageHint")
                        : t("fixedHint")}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="automatic"
              render={({ field }) => (
                <FormItem className="flex items-center gap-3">
                  <FormLabel>{t("automaticLabel")}</FormLabel>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={(checked) => {
                        field.onChange(checked);
                        if (checked) form.setValue("code", "");
                      }}
                    />
                  </FormControl>
                  <FormDescription>{t("automaticHint")}</FormDescription>
                </FormItem>
              )}
            />

            {!watchAutomatic && (
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("code")}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("codePlaceholder")}
                        {...field}
                        onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                      />
                    </FormControl>
                    <FormDescription>{t("codeHint")}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </CardContent>
        </Card>

        {/* Conditions */}
        <Card>
          <CardHeader>
            <CardTitle>{t("conditions")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="minOrderAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("minOrderAmount")}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      placeholder="0"
                      value={field.value ?? ""}
                      onChange={(e) =>
                        field.onChange(e.target.value ? Number(e.target.value) : undefined)
                      }
                    />
                  </FormControl>
                  <FormDescription>{t("minOrderAmountHint")}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="maxUses"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("maxUses")}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        placeholder={t("unlimited")}
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(e.target.value ? Number(e.target.value) : undefined)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="maxUsesPerCustomer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("maxUsesPerCustomer")}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        placeholder={t("unlimited")}
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(e.target.value ? Number(e.target.value) : undefined)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Validity Period */}
        <Card>
          <CardHeader>
            <CardTitle>{t("validity")}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="startsAt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("startsAt")}</FormLabel>
                  <FormControl>
                    <Input
                      type="datetime-local"
                      value={field.value ?? ""}
                      onChange={(e) => field.onChange(e.target.value || undefined)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="expiresAt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("expiresAt")}</FormLabel>
                  <FormControl>
                    <Input
                      type="datetime-local"
                      value={field.value ?? ""}
                      onChange={(e) => field.onChange(e.target.value || undefined)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Scope */}
        <Card>
          <CardHeader>
            <CardTitle>{t("scope")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <FormLabel>{t("appliesTo")}</FormLabel>
              <div className="mt-2 flex gap-2">
                <Button
                  type="button"
                  variant={appliesTo === "everything" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setAppliesTo("everything")}
                >
                  {t("appliesToEverything")}
                </Button>
                <Button
                  type="button"
                  variant={appliesTo === "specific" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setAppliesTo("specific")}
                >
                  {t("appliesToSpecific")}
                </Button>
              </div>
            </div>

            {appliesTo === "specific" && (
              <>
                <FormField
                  control={form.control}
                  name="productIds"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("scopeProducts")}</FormLabel>
                      <div className="max-h-48 space-y-2 overflow-y-auto rounded-md border p-3">
                        {products.length === 0 ? (
                          <p className="text-muted-foreground text-sm">{t("noProductsAvailable")}</p>
                        ) : (
                          products.map((product) => (
                            <label
                              key={product.id}
                              className="flex items-center gap-2 text-sm"
                            >
                              <input
                                type="checkbox"
                                checked={field.value.includes(product.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    field.onChange([...field.value, product.id]);
                                  } else {
                                    field.onChange(
                                      field.value.filter((id) => id !== product.id),
                                    );
                                  }
                                }}
                                className="rounded"
                              />
                              {product.name}
                            </label>
                          ))
                        )}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="categoryIds"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("scopeCategories")}</FormLabel>
                      <div className="max-h-48 space-y-2 overflow-y-auto rounded-md border p-3">
                        {categories.length === 0 ? (
                          <p className="text-muted-foreground text-sm">{t("noCategoriesAvailable")}</p>
                        ) : (
                          categories.map((category) => (
                            <label
                              key={category.id}
                              className="flex items-center gap-2 text-sm"
                            >
                              <input
                                type="checkbox"
                                checked={field.value.includes(category.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    field.onChange([...field.value, category.id]);
                                  } else {
                                    field.onChange(
                                      field.value.filter((id) => id !== category.id),
                                    );
                                  }
                                }}
                                className="rounded"
                              />
                              {category.name}
                            </label>
                          ))
                        )}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-4">
          <Button type="submit" disabled={isPending}>
            {isPending
              ? tc("updating")
              : discount
                ? t("updateDiscount")
                : t("createDiscount")}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/${locale}/admin/discounts`)}
          >
            {tc("cancel")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
