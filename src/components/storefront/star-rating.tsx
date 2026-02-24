"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

type StarRatingProps = {
  rating: number;
  maxStars?: number;
  size?: "sm" | "md" | "lg";
  interactive?: boolean;
  onRate?: (rating: number) => void;
};

const sizeMap = {
  sm: "h-3.5 w-3.5",
  md: "h-5 w-5",
  lg: "h-6 w-6",
};

export function StarRating({
  rating,
  maxStars = 5,
  size = "md",
  interactive = false,
  onRate,
}: StarRatingProps) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: maxStars }, (_, i) => {
        const starValue = i + 1;
        const filled = starValue <= Math.round(rating);

        return (
          <button
            key={i}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && onRate?.(starValue)}
            className={cn(
              "p-0",
              interactive
                ? "cursor-pointer transition-transform hover:scale-110"
                : "cursor-default",
            )}
          >
            <Star
              className={cn(
                sizeMap[size],
                filled
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-muted-foreground/40 fill-none",
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
