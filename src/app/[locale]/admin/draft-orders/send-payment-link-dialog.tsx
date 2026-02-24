"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { sendPaymentLink } from "@/server/actions/draft-orders";

type Props = {
  orderId: string;
  open: boolean;
  onClose: () => void;
};

export function SendPaymentLinkDialog({ orderId, open, onClose }: Props) {
  const t = useTranslations("admin.draftOrders.sendLink");
  const router = useRouter();
  const [customMessage, setCustomMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSend() {
    setSending(true);
    setError(null);
    try {
      await sendPaymentLink({ orderId, customMessage });
      setSuccess(true);
      setTimeout(() => {
        onClose();
        router.refresh();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send payment link");
    } finally {
      setSending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="py-4 text-center">
            <p className="text-sm text-green-600">{t("success")}</p>
          </div>
        ) : (
          <>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>{t("messageLabel")}</Label>
                <Textarea
                  placeholder={t("messagePlaceholder")}
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  rows={3}
                  maxLength={500}
                />
                <p className="text-muted-foreground text-xs">{t("messageHint")}</p>
              </div>

              {error && <p className="text-destructive text-sm">{error}</p>}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={onClose} disabled={sending}>
                {t("cancel")}
              </Button>
              <Button onClick={handleSend} disabled={sending}>
                {sending ? t("sending") : t("send")}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
