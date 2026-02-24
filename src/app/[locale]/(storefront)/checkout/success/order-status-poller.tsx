"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

const MAX_ATTEMPTS = 10;
const POLL_INTERVAL = 3000;

export function OrderStatusPoller({
  orderId,
  token,
  pendingMessage,
  fallbackMessage,
}: {
  orderId: string;
  token: string;
  pendingMessage: string;
  fallbackMessage: string;
}) {
  const router = useRouter();
  const [, setAttempts] = useState(0);
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (timedOut) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(
          `/api/orders/${orderId}/status?token=${encodeURIComponent(token)}`,
        );
        if (!res.ok) return;

        const data = await res.json();

        if (data.paymentStatus !== "PENDING") {
          clearInterval(interval);
          router.refresh();
          return;
        }
      } catch {
        // Network error — keep trying
      }

      setAttempts((prev) => {
        const next = prev + 1;
        if (next >= MAX_ATTEMPTS) {
          clearInterval(interval);
          setTimedOut(true);
        }
        return next;
      });
    }, POLL_INTERVAL);

    return () => clearInterval(interval);
  }, [orderId, token, timedOut, router]);

  if (timedOut) {
    return <p className="text-muted-foreground text-center text-sm">{fallbackMessage}</p>;
  }

  return (
    <div className="text-muted-foreground flex items-center justify-center gap-2 text-sm">
      <Loader2 className="h-4 w-4 animate-spin" />
      <span>{pendingMessage}</span>
    </div>
  );
}
