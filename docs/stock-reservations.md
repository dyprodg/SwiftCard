# Stock Reservation System

## Overview

The stock reservation system tracks the lifecycle of inventory holds during checkout. When a customer starts checkout, stock is decremented immediately and a reservation record is created. Depending on the payment outcome, the reservation is either **converted** (payment succeeded, stock stays sold) or **expired** (payment failed or abandoned, stock is restored).

## Checkout Flow

```
Customer adds items to cart
          │
          ▼
    ┌─────────────┐
    │   Checkout   │  POST /api/checkout
    │   Submitted  │
    └──────┬──────┘
           │
           ▼
  ┌────────────────────┐
  │  Transaction:       │
  │  1. Validate items  │
  │  2. Calculate total │
  │  3. Create order    │
  │  4. Insert items    │
  │  5. Decrement stock │  ← atomic: fails if insufficient
  │  6. Create RESERVED │  ← reservation row with expiresAt
  └────────┬───────────┘
           │
           ▼
  ┌────────────────────┐
  │  Create Stripe      │
  │  PaymentIntent      │
  └────────┬───────────┘
           │
     ┌─────┴──────┐
     ▼            ▼
  SUCCESS       FAILURE / ABANDON
     │            │
     ▼            ▼
  Webhook:     Webhook (failure):
  RESERVED     RESERVED → EXPIRED
  → CONVERTED  + stock restored
  (stock stays │
  decremented) │ Abandon (no webhook):
               │ Cron job expires after
               │ timeout (default 15 min)
               └→ RESERVED → EXPIRED
                  + stock restored
```

## Reservation States

| Status      | Meaning                              | Stock Effect                        |
| ----------- | ------------------------------------ | ----------------------------------- |
| `RESERVED`  | Checkout in progress, stock held     | Stock already decremented           |
| `CONVERTED` | Payment succeeded                    | No change (stock stays decremented) |
| `EXPIRED`   | Payment failed or checkout abandoned | Stock restored                      |

## Key Design Decision

The `productVariants.stock` column always reflects **real available inventory**. Stock is decremented at reservation time, not at payment time. The reservation table is a tracking/audit layer — no "stock minus reserved" math is needed anywhere in the app.

## Retry Payment Flow

When a customer retries a failed payment:

1. The original reservations were already `EXPIRED` (stock restored) by the failure webhook
2. New `RESERVED` rows are created with a fresh `expiresAt`
3. Stock is decremented again atomically
4. Old `EXPIRED` rows remain as audit trail

## Race Condition Safety

The cron job that expires stale reservations joins with the `orders` table and **only expires reservations where the order is still `PENDING` or `FAILED`**. This prevents a scenario where:

- Customer pays successfully
- Stripe webhook is slightly delayed
- Cron fires and sees an expired `expiresAt`
- Without the order status check, it would incorrectly restore stock

With the check, the cron skips any reservation whose order has already been paid.

## Cron Job: Expiring Abandoned Checkouts

The endpoint `GET /api/cron/expire-reservations` finds all `RESERVED` rows past their `expiresAt` where the order is still `PENDING` or `FAILED`, restores stock, and marks them `EXPIRED`.

### Scheduling Options

The cron needs to run frequently (every 5 minutes is ideal) to release held stock promptly. There are several ways to schedule it depending on your deployment setup:

#### Vercel Pro Plan

If you're on Vercel Pro ($20/month), use native Vercel Cron via `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/expire-reservations",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

No additional setup needed. Vercel triggers the endpoint automatically.

#### Vercel Hobby Plan (Current Setup)

Vercel Hobby only supports **once-per-day** cron jobs. We use a two-layer approach:

1. **GitHub Actions** (primary) — runs every 5 minutes, free within the 2,000 min/month allowance (~500 min/month used). Defined in `.github/workflows/expire-reservations.yml`.
2. **Vercel Cron** (fallback) — runs once daily at midnight UTC via `vercel.json`.

**Required GitHub Secrets:**

- `CRON_SECRET` — same value as in Vercel env vars
- `APP_URL` — your production URL (e.g. `https://swift-card.vercel.app`)

#### Docker / Self-Hosted

The endpoint is a plain HTTP GET with bearer token auth — no Vercel dependencies. Use any scheduler:

**System cron (simplest):**

```bash
# /etc/cron.d/swiftcard-reservations
*/5 * * * * curl -s -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/expire-reservations
```

**Docker Compose sidecar:**

```yaml
services:
  app:
    build: .
    ports:
      - "3000:3000"

  cron:
    image: alpine:latest
    depends_on:
      - app
    entrypoint: /bin/sh -c "
      echo '*/5 * * * * wget -qO- --header=\"Authorization: Bearer $$CRON_SECRET\" http://app:3000/api/cron/expire-reservations' | crontab - && crond -f"
    environment:
      - CRON_SECRET=${CRON_SECRET}
```

**Node.js in-process (no external scheduler):**

```typescript
// In your server startup
import cron from "node-cron";

cron.schedule("*/5 * * * *", async () => {
  await fetch("http://localhost:3000/api/cron/expire-reservations", {
    headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` },
  });
});
```

## Configuration

The reservation timeout is configurable via the admin panel at `/admin/settings/reservations`. It's stored in Vercel Edge Config (or defaults to 15 minutes if Edge Config is unavailable).

| Setting           | Default | Range | Description                                        |
| ----------------- | ------- | ----- | -------------------------------------------------- |
| Timeout (minutes) | 15      | 5–60  | How long stock is held before the cron releases it |

## Admin Visibility

The admin panel at `/admin/reservations` shows:

- **Stats cards** — active reservation count and total units held
- **Filterable table** — all reservations with status filter (Reserved / Converted / Expired)
- **Columns** — variant SKU, quantity, session ID, linked order, status, expiry time, created time

## Database Schema

```sql
CREATE TYPE reservation_status AS ENUM ('RESERVED', 'CONVERTED', 'EXPIRED');

CREATE TABLE stock_reservations (
  id          TEXT PRIMARY KEY,
  variant_id  TEXT NOT NULL,
  quantity    INTEGER NOT NULL,
  session_id  TEXT NOT NULL,
  order_id    TEXT,
  status      reservation_status DEFAULT 'RESERVED' NOT NULL,
  expires_at  TIMESTAMP NOT NULL,
  created_at  TIMESTAMP DEFAULT NOW() NOT NULL,
  converted_at TIMESTAMP,
  expired_at  TIMESTAMP
);
```

Indexes on: `variant_id`, `session_id`, `order_id`, `status`, `expires_at`.

## Files

| File                                            | Purpose                                           |
| ----------------------------------------------- | ------------------------------------------------- |
| `src/db/schema/reservations.ts`                 | Schema definition                                 |
| `src/lib/reservations.ts`                       | Core logic (create, convert, expire, expireStale) |
| `src/app/api/cron/expire-reservations/route.ts` | Cron endpoint                                     |
| `src/server/queries/reservations.ts`            | Admin queries                                     |
| `src/app/[locale]/admin/reservations/`          | Admin list page                                   |
| `src/app/[locale]/admin/settings/reservations/` | Timeout settings page                             |
| `.github/workflows/expire-reservations.yml`     | GitHub Actions cron (Hobby plan)                  |
| `vercel.json`                                   | Vercel cron config (daily fallback / Pro plan)    |
