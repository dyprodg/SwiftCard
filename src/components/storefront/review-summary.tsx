import { Star } from "lucide-react";
import type { ReviewRatingStats } from "@/types";

type ReviewSummaryProps = {
  stats: ReviewRatingStats;
};

export function ReviewSummary({ stats }: ReviewSummaryProps) {
  if (stats.totalReviews === 0) return null;

  return (
    <div className="flex items-center gap-1 text-sm">
      <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
      <span className="font-medium">{stats.averageRating.toFixed(1)}</span>
      <span className="text-muted-foreground">({stats.totalReviews})</span>
    </div>
  );
}
