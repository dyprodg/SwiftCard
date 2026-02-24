import { getTranslations } from "next-intl/server";
import { auth } from "@clerk/nextjs/server";

import {
  getProductReviews,
  getProductRatingStats,
  getUserReview,
} from "@/server/queries/reviews";
import { StarRating } from "./star-rating";
import { ReviewForm } from "./review-form";
import { Badge } from "@/components/ui/badge";

type ReviewListProps = {
  productId: string;
};

export async function ReviewList({ productId }: ReviewListProps) {
  const t = await getTranslations("reviews");
  const { userId } = await auth();

  const [reviews, stats, existingReview] = await Promise.all([
    getProductReviews(productId),
    getProductRatingStats(productId),
    userId ? getUserReview(userId, productId) : null,
  ]);

  const showPendingReview = existingReview && existingReview.status !== "APPROVED";

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">{t("title")}</h2>
        {stats.totalReviews > 0 && (
          <div className="flex items-center gap-2">
            <StarRating rating={stats.averageRating} size="sm" />
            <span className="text-muted-foreground text-sm">
              {stats.averageRating.toFixed(1)} ({stats.totalReviews})
            </span>
          </div>
        )}
      </div>

      {/* Review form (signed in, hasn't reviewed yet) */}
      {userId && !existingReview && (
        <div className="rounded-lg border p-4">
          <h3 className="mb-3 font-medium">{t("writeReview")}</h3>
          <ReviewForm productId={productId} />
        </div>
      )}

      {/* Show user's own pending/rejected review */}
      {showPendingReview && (
        <div className="rounded-lg border border-dashed p-4">
          <div className="mb-2 flex items-center gap-2">
            <span className="text-sm font-medium">{t("yourReview")}</span>
            <Badge variant="outline" className="text-xs">
              {existingReview.status === "PENDING"
                ? t("pendingModeration")
                : t("rejected")}
            </Badge>
          </div>
          <div className="mb-2 flex items-center gap-2">
            <StarRating rating={existingReview.rating} size="sm" />
          </div>
          <h4 className="font-medium">{existingReview.title}</h4>
          {existingReview.body && (
            <p className="text-muted-foreground mt-1 text-sm">{existingReview.body}</p>
          )}
          <p className="text-muted-foreground mt-2 text-xs">
            {new Date(existingReview.createdAt).toLocaleDateString()}
          </p>
        </div>
      )}

      {!userId && <p className="text-muted-foreground text-sm">{t("signInToReview")}</p>}

      {/* Reviews list */}
      {reviews.length > 0 ? (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="rounded-lg border p-4">
              <div className="mb-2 flex items-center gap-2">
                <StarRating rating={review.rating} size="sm" />
                {review.verified && (
                  <Badge variant="secondary" className="text-xs">
                    {t("verifiedPurchase")}
                  </Badge>
                )}
              </div>
              <h4 className="font-medium">{review.title}</h4>
              {review.body && (
                <p className="text-muted-foreground mt-1 text-sm">{review.body}</p>
              )}
              <p className="text-muted-foreground mt-2 text-xs">
                {review.userName} &middot;{" "}
                {new Date(review.createdAt).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      ) : (
        !showPendingReview && (
          <p className="text-muted-foreground text-sm">{t("noReviews")}</p>
        )
      )}
    </section>
  );
}
