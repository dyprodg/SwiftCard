import { getTranslations } from "next-intl/server";
import { getAdminReviews } from "@/server/queries/reviews";
import { ReviewsClient } from "./reviews-client";

export default async function AdminReviewsPage() {
  const t = await getTranslations("admin.reviews");
  const { items, total } = await getAdminReviews({ limit: 50 });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>
      <ReviewsClient reviews={items} total={total} />
    </div>
  );
}
