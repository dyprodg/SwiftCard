"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { subscribeToNewsletter } from "@/server/actions/newsletter";

export function NewsletterFooterForm() {
  const t = useTranslations("footer");
  const [isPending, startTransition] = useTransition();
  const [email, setEmail] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    startTransition(async () => {
      try {
        const result = await subscribeToNewsletter(email, "footer");
        if (result.alreadySubscribed) {
          toast.info(t("alreadySubscribed"));
        } else {
          toast.success(t("subscribeSuccess"));
        }
        setEmail("");
      } catch {
        toast.error(t("subscribeError"));
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={t("subscribePlaceholder")}
        required
        className="max-w-[220px]"
      />
      <Button type="submit" size="sm" disabled={isPending}>
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t("subscribe")}
      </Button>
    </form>
  );
}
