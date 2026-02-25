"use client";

import { useState, useTransition } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  subscriptionPlanFormSchema,
  type SubscriptionPlanFormValues,
} from "@/lib/validations/subscription";
import {
  createSubscriptionPlan,
  updateSubscriptionPlan,
} from "@/server/actions/subscriptions";
import type { SubscriptionPlan } from "@/types";

type Props = {
  plan?: SubscriptionPlan;
};

export function SubscriptionPlanForm({ plan }: Props) {
  const t = useTranslations("admin.subscriptions");
  const router = useRouter();
  const { locale } = useParams<{ locale: string }>();
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SubscriptionPlanFormValues>({
    resolver: zodResolver(subscriptionPlanFormSchema),
    defaultValues: plan
      ? {
          productId: plan.productId,
          variantId: plan.variantId ?? undefined,
          name: plan.name,
          interval: plan.interval,
          discountPercent: plan.discountPercent,
        }
      : {
          productId: "",
          name: "",
          interval: "MONTHLY",
          discountPercent: 0,
        },
  });

  const interval = watch("interval");

  function onSubmit(data: SubscriptionPlanFormValues) {
    startTransition(async () => {
      try {
        if (plan) {
          await updateSubscriptionPlan({
            id: plan.id,
            name: data.name,
            discountPercent: data.discountPercent,
          });
          toast.success(t("saved"));
        } else {
          await createSubscriptionPlan(data);
          toast.success(t("created"));
        }
        router.push(`/${locale}/admin/subscriptions`);
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : t("error"));
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Card>
        <CardHeader>
          <CardTitle>{t("planDetails")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!plan && (
            <>
              <div>
                <Label>{t("productId")}</Label>
                <Input
                  {...register("productId")}
                  placeholder={t("productIdPlaceholder")}
                  className="mt-1"
                />
                {errors.productId && (
                  <p className="text-destructive mt-1 text-sm">
                    {errors.productId.message}
                  </p>
                )}
              </div>
              <div>
                <Label>{t("variantId")}</Label>
                <Input
                  {...register("variantId")}
                  placeholder={t("variantIdPlaceholder")}
                  className="mt-1"
                />
              </div>
            </>
          )}

          <div>
            <Label>{t("planName")}</Label>
            <Input
              {...register("name")}
              placeholder={t("planNamePlaceholder")}
              className="mt-1"
            />
            {errors.name && (
              <p className="text-destructive mt-1 text-sm">{errors.name.message}</p>
            )}
          </div>

          {!plan && (
            <div>
              <Label>{t("interval")}</Label>
              <Select
                value={interval}
                onValueChange={(v) =>
                  setValue("interval", v as "WEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY")
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WEEKLY">{t("WEEKLY")}</SelectItem>
                  <SelectItem value="MONTHLY">{t("MONTHLY")}</SelectItem>
                  <SelectItem value="QUARTERLY">{t("QUARTERLY")}</SelectItem>
                  <SelectItem value="YEARLY">{t("YEARLY")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label>{t("discountPercent")}</Label>
            <Input
              type="number"
              {...register("discountPercent", { valueAsNumber: true })}
              placeholder="0"
              className="mt-1"
            />
            <p className="text-muted-foreground mt-1 text-xs">{t("discountHint")}</p>
            {errors.discountPercent && (
              <p className="text-destructive mt-1 text-sm">
                {errors.discountPercent.message}
              </p>
            )}
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {plan ? t("save") : t("create")}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/${locale}/admin/subscriptions`)}
            >
              {t("cancel")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
