import { getTranslations } from "next-intl/server";
import {
  getReservations,
  getActiveReservationStats,
} from "@/server/queries/reservations";
import { ReservationsClient } from "./reservations-client";

type Props = {
  searchParams: Promise<{
    page?: string;
    status?: string;
  }>;
};

export default async function AdminReservationsPage({ searchParams }: Props) {
  const params = await searchParams;
  const t = await getTranslations("admin.reservations");
  const page = Number(params.page) || 1;
  const status = params.status as "RESERVED" | "CONVERTED" | "EXPIRED" | undefined;

  const [result, stats] = await Promise.all([
    getReservations({ status, page, pageSize: 20 }),
    getActiveReservationStats(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground text-sm">{t("description")}</p>
      </div>

      <ReservationsClient
        reservations={result.items}
        total={result.total}
        page={result.page}
        pageSize={result.pageSize}
        totalPages={result.totalPages}
        currentStatus={status}
        stats={stats}
      />
    </div>
  );
}
