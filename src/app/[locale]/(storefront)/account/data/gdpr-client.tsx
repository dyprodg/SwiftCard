"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Download, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { exportUserData, deleteUserAccount } from "@/server/actions/gdpr";

export function GdprClient() {
  const t = useTranslations("gdpr");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [exportPending, startExport] = useTransition();
  const [deletePending, startDelete] = useTransition();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  function handleExport() {
    startExport(async () => {
      try {
        const data = await exportUserData();
        const blob = new Blob([JSON.stringify(data, null, 2)], {
          type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `swiftcart-data-export-${new Date().toISOString().split("T")[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success(t("export.success"));
      } catch {
        toast.error(t("export.error"));
      }
    });
  }

  function handleDelete() {
    startDelete(async () => {
      try {
        const result = await deleteUserAccount();
        if (result.success) {
          toast.success(t("delete.success"));
          router.push("/");
        } else {
          toast.error(result.error ?? t("delete.error"));
        }
      } catch {
        toast.error(t("delete.error"));
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Export Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            {t("export.title")}
          </CardTitle>
          <CardDescription>{t("export.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleExport} disabled={exportPending}>
            {exportPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t("export.button")}
          </Button>
        </CardContent>
      </Card>

      {/* Delete Card */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center gap-2">
            <Trash2 className="h-5 w-5" />
            {t("delete.title")}
          </CardTitle>
          <CardDescription>{t("delete.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
            {t("delete.button")}
          </Button>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("delete.confirm")}</DialogTitle>
            <DialogDescription>{t("delete.confirmDescription")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={deletePending}
            >
              {tCommon("cancel")}
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deletePending}>
              {deletePending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("delete.confirmButton")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
