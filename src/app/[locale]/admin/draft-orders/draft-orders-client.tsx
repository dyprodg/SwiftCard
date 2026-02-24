"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Plus, Send, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { formatPrice } from "@/lib/utils/format-price";
import { deleteDraftOrder, sendPaymentLink } from "@/server/actions/draft-orders";
import { SendPaymentLinkDialog } from "./send-payment-link-dialog";
import type { OrderWithItems } from "@/types";

type Props = {
  orders: OrderWithItems[];
};

export function DraftOrdersClient({ orders }: Props) {
  const locale = useLocale();
  const t = useTranslations("admin.draftOrders");
  const router = useRouter();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [sendLinkOrderId, setSendLinkOrderId] = useState<string | null>(null);

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await deleteDraftOrder(deleteId);
      router.refresh();
    } catch (err) {
      console.error("Failed to delete draft:", err);
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  }

  return (
    <>
      <div className="flex justify-end">
        <Button asChild>
          <Link href={`/${locale}/admin/draft-orders/new`}>
            <Plus className="mr-2 h-4 w-4" />
            {t("create")}
          </Link>
        </Button>
      </div>

      {orders.length === 0 ? (
        <div className="rounded-md border border-dashed p-8 text-center">
          <p className="text-muted-foreground">{t("empty")}</p>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("columns.order")}</TableHead>
                <TableHead>{t("columns.customer")}</TableHead>
                <TableHead>{t("columns.items")}</TableHead>
                <TableHead className="text-right">{t("columns.total")}</TableHead>
                <TableHead>{t("columns.date")}</TableHead>
                <TableHead className="text-right">{t("columns.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.orderNumber}</TableCell>
                  <TableCell>
                    <div>
                      <div className="text-sm">{order.shippingName}</div>
                      <div className="text-muted-foreground text-xs">
                        {order.customerEmail}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {order.items.length} {order.items.length === 1 ? "item" : "items"}
                  </TableCell>
                  <TableCell className="text-right">{formatPrice(order.total)}</TableCell>
                  <TableCell>
                    {new Date(order.createdAt).toLocaleDateString(
                      locale === "de" ? "de-CH" : "en-CH",
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/${locale}/admin/draft-orders/${order.id}`}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSendLinkOrderId(order.id)}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteId(order.id)}
                      >
                        <Trash2 className="text-destructive h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteDialog.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteDialog.description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>
              {t("deleteDialog.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? t("deleteDialog.deleting") : t("deleteDialog.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Send payment link dialog */}
      {sendLinkOrderId && (
        <SendPaymentLinkDialog
          orderId={sendLinkOrderId}
          open={!!sendLinkOrderId}
          onClose={() => setSendLinkOrderId(null)}
        />
      )}
    </>
  );
}
