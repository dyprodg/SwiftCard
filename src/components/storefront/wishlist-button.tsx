"use client";

import { useTransition } from "react";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toggleWishlistItem } from "@/server/actions/wishlist";

type WishlistButtonProps = {
  productId: string;
  isWishlisted: boolean;
  variant?: "icon" | "overlay";
};

export function WishlistButton({
  productId,
  isWishlisted,
  variant = "icon",
}: WishlistButtonProps) {
  const t = useTranslations("wishlist");
  const [isPending, startTransition] = useTransition();

  function handleToggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    startTransition(async () => {
      try {
        const result = await toggleWishlistItem({ productId });
        if (result.success) {
          toast.success(result.added ? t("added") : t("removed"));
        } else {
          toast.error(result.error ?? t("error"));
        }
      } catch {
        toast.error(t("error"));
      }
    });
  }

  if (variant === "overlay") {
    return (
      <button
        onClick={handleToggle}
        disabled={isPending}
        className="bg-background/80 hover:bg-background rounded-full p-1.5 shadow-sm backdrop-blur transition-colors"
        aria-label={isWishlisted ? t("removeFromWishlist") : t("addToWishlist")}
      >
        <Heart
          className={cn(
            "h-4 w-4 transition-colors",
            isWishlisted ? "fill-red-500 text-red-500" : "text-muted-foreground",
            isPending && "opacity-50",
          )}
        />
      </button>
    );
  }

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={handleToggle}
      disabled={isPending}
      aria-label={isWishlisted ? t("removeFromWishlist") : t("addToWishlist")}
    >
      <Heart
        className={cn(
          "h-5 w-5 transition-colors",
          isWishlisted ? "fill-red-500 text-red-500" : "",
          isPending && "opacity-50",
        )}
      />
    </Button>
  );
}
