"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, X, Trash2, Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { moderateReview, deleteReview } from "@/server/actions/reviews";

type ReviewWithProduct = {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  userEmail: string;
  rating: number;
  title: string;
  body: string | null;
  verified: boolean;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: Date;
  product: { id: string; name: string; slug: string };
};

type ReviewsClientProps = {
  reviews: ReviewWithProduct[];
  total: number;
};

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "PENDING":
      return <Badge variant="outline">Pending</Badge>;
    case "APPROVED":
      return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
    case "REJECTED":
      return <Badge variant="destructive">Rejected</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export function ReviewsClient({ reviews, total }: ReviewsClientProps) {
  const t = useTranslations("admin.reviews");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleModerate(reviewId: string, status: "APPROVED" | "REJECTED") {
    startTransition(async () => {
      const result = await moderateReview({ reviewId, status });
      if (result.success) {
        toast.success(t("moderated"));
        router.refresh();
      } else {
        toast.error(result.error ?? t("error"));
      }
    });
  }

  function handleDelete(reviewId: string) {
    startTransition(async () => {
      const result = await deleteReview({ reviewId });
      if (result.success) {
        toast.success(t("deleted"));
        router.refresh();
      } else {
        toast.error(result.error ?? t("error"));
      }
    });
  }

  return (
    <div>
      <p className="text-muted-foreground mb-4 text-sm">
        {t("totalCount", { count: total })}
      </p>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("product")}</TableHead>
              <TableHead>{t("customer")}</TableHead>
              <TableHead>{t("rating")}</TableHead>
              <TableHead>{t("reviewTitle")}</TableHead>
              <TableHead>{t("status")}</TableHead>
              <TableHead>{t("date")}</TableHead>
              <TableHead className="text-right">{t("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reviews.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-muted-foreground text-center">
                  {t("noReviews")}
                </TableCell>
              </TableRow>
            ) : (
              reviews.map((review) => (
                <TableRow key={review.id}>
                  <TableCell className="max-w-[150px] truncate font-medium">
                    {review.product.name}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm">{review.userName}</p>
                      <p className="text-muted-foreground text-xs">{review.userEmail}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span>{review.rating}</span>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[200px]">
                    <p className="truncate text-sm">{review.title}</p>
                    {review.body && (
                      <p className="text-muted-foreground truncate text-xs">
                        {review.body}
                      </p>
                    )}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={review.status} />
                    {review.verified && (
                      <Badge variant="secondary" className="ml-1 text-xs">
                        {t("verified")}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {review.status !== "APPROVED" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={isPending}
                          onClick={() => handleModerate(review.id, "APPROVED")}
                          title={t("approve")}
                        >
                          <Check className="h-4 w-4 text-green-600" />
                        </Button>
                      )}
                      {review.status !== "REJECTED" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={isPending}
                          onClick={() => handleModerate(review.id, "REJECTED")}
                          title={t("reject")}
                        >
                          <X className="h-4 w-4 text-red-600" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={isPending}
                        onClick={() => handleDelete(review.id)}
                        title={t("deleteReview")}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
