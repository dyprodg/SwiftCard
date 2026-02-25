"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Loader2, Upload } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { importSubscribers } from "@/server/actions/newsletter";

export function SubscriberActions() {
  const t = useTranslations("admin.emailMarketing");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [emailText, setEmailText] = useState("");

  function handleImport() {
    const emails = emailText
      .split(/[\n,;]+/)
      .map((e) => e.trim())
      .filter((e) => e.length > 0);

    if (emails.length === 0) return;

    startTransition(async () => {
      try {
        const result = await importSubscribers({ emails });
        toast.success(t("importSuccess", { count: result.imported }));
        setOpen(false);
        setEmailText("");
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : t("error"));
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="mr-2 h-4 w-4" />
          {t("import")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("import")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>{t("importDescription")}</Label>
            <Textarea
              value={emailText}
              onChange={(e) => setEmailText(e.target.value)}
              rows={8}
              placeholder="email1@example.com&#10;email2@example.com"
              className="mt-2"
            />
          </div>
          <Button onClick={handleImport} disabled={isPending || !emailText.trim()}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t("import")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
