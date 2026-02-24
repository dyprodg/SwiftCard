"use client";

import { useState, useTransition, useCallback, memo } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { StarRating } from "./star-rating";
import { submitReview } from "@/server/actions/reviews";

type ReviewFormProps = {
  productId: string;
};

export const ReviewForm = memo(function ReviewForm({ productId }: ReviewFormProps) {
  const t = useTranslations("reviews");
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleRate = useCallback((value: number) => {
    setRating(value);
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) {
      toast.error(t("selectRating"));
      return;
    }

    startTransition(async () => {
      try {
        const result = await submitReview({
          productId,
          rating,
          title,
          body: body || undefined,
        });
        if (result.success) {
          toast.success(t("submitted"));
          setRating(0);
          setTitle("");
          setBody("");
        } else {
          toast.error(result.error ?? t("submitError"));
        }
      } catch {
        toast.error(t("submitError"));
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium">{t("yourRating")}</label>
        <StarRating rating={rating} interactive onRate={handleRate} />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">{t("titleLabel")}</label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t("titlePlaceholder")}
          maxLength={200}
          required
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">{t("bodyLabel")}</label>
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={t("bodyPlaceholder")}
          maxLength={2000}
          rows={3}
        />
      </div>
      <Button type="submit" disabled={isPending || rating === 0}>
        {isPending ? t("submitting") : t("submitReview")}
      </Button>
    </form>
  );
});
