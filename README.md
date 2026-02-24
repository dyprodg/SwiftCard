# SwiftCard

**Self-hostable e-commerce. No vendor lock-in. Full ownership.**

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Tests](https://img.shields.io/badge/Tests-175%2B-brightgreen)](.)

SwiftCard is an open-source e-commerce boilerplate built on Next.js 16. Clone it, configure your env vars, deploy to Vercel (or self-host), and you have a production-ready store — no monthly platform fees, no data lock-in, no limits on what you can customize.

Built for developers who want Shopify-level functionality with full control over their stack.

---

## Why SwiftCard?

- **No platform lock-in** — your store is a Git repo you own and control
- **Free to deploy** — runs on Vercel's free tier for small stores
- **Modern stack** — React 19, Next.js 16, TypeScript, Tailwind CSS 4
- **Self-hostable** — deploy anywhere that runs Node.js (Docker support coming)
- **Fully customizable** — it's your codebase, change anything

---

## Tech Stack

| Layer      | Technology                                            |
| ---------- | ----------------------------------------------------- |
| Framework  | Next.js 16 (App Router, `"use cache"`, Turbopack)     |
| Runtime    | Bun                                                   |
| Language   | TypeScript (strict)                                   |
| Database   | PostgreSQL via Supabase + Drizzle ORM                 |
| Auth       | Clerk                                                 |
| Payments   | Stripe (Checkout, Webhooks, Refunds)                  |
| Email      | Resend + React Email                                  |
| Storage    | Vercel Blob (images), Vercel KV (cart, rate limiting) |
| Config     | Vercel Edge Config (shop settings, feature flags)     |
| i18n       | next-intl (DE/EN)                                     |
| UI         | shadcn/ui, Radix, Tailwind CSS 4, Lucide icons        |
| State      | Zustand (client), React Hook Form + Zod (forms)       |
| Monitoring | Sentry                                                |
| Testing    | Vitest (unit), Playwright (E2E), GitHub Actions CI    |

---

## Features

### Storefront

- Multi-variant product catalog with image uploads
- Shopping cart (persistent via Vercel KV)
- Stripe checkout with real-time order status polling
- Discount codes and automatic promotions
- Per-item discount display with strikethrough pricing
- "Only X left" low-stock indicators
- Customer order history and tracking
- Internationalization (German & English)
- SEO: dynamic metadata, sitemap.xml, JSON-LD structured data
- Cookie consent, legal pages (privacy, terms, imprint)
- Dark mode

### Admin Dashboard

- Real-time sales metrics and order overview
- Product management (CRUD, variants, images, categories)
- Order management with status workflows
- Customer management and lookup
- **Refunds** — full and partial refunds, per-item, with stock restoration
- **Fulfillment** — ship orders with tracking numbers (Swiss Post, DHL, UPS), partial fulfillment, printable packing slips
- **Stock reservations** — 15-min hold at checkout, auto-expiry via cron, admin visibility
- **Discounts** — percentage, fixed amount, free shipping; scoped to products or categories
- Shop settings via Edge Config (maintenance mode, event banners, reservation timeout)
- Role-based access via Clerk (admin metadata)

### Infrastructure

- `"use cache"` with cache tags and on-demand revalidation
- Rate limiting on API routes
- CSP and HSTS security headers
- GDPR data export and deletion endpoints
- Error boundaries with Sentry integration
- 175+ unit tests, E2E coverage, CI pipeline

---

## Quick Start

### Prerequisites

- [Bun](https://bun.sh/) (v1.1+)
- PostgreSQL database ([Supabase](https://supabase.com/) free tier works)
- [Stripe](https://stripe.com/) account
- [Clerk](https://clerk.com/) account
- [Vercel](https://vercel.com/) account (for Blob, KV, Edge Config — or swap with alternatives)

### 1. Clone and install

```bash
git clone https://github.com/dyprodg/SwiftCard.git
cd SwiftCard
bun install
```

### 2. Set up environment

```bash
cp .env.example .env.local
```

Fill in your keys:

```env
# Database
DATABASE_URL=postgresql://...

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...

# Stripe
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...

# Resend
RESEND_API_KEY=re_...

# Vercel
BLOB_READ_WRITE_TOKEN=vercel_blob_...
KV_REST_API_URL=https://...
KV_REST_API_TOKEN=...
EDGE_CONFIG=https://edge-config.vercel.com/...
EDGE_CONFIG_ID=ecfg_...
VERCEL_API_TOKEN=...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
CRON_SECRET=your-cron-secret
```

### 3. Set up the database

```bash
bun run db:migrate
bun run db:seed
```

### 4. Run locally

```bash
bun dev
```

Open [http://localhost:3000](http://localhost:3000).

For Stripe webhooks locally, use the [Stripe CLI](https://stripe.com/docs/stripe-cli):

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

### 5. Deploy

Deploy to Vercel with one click, or push to a connected repo:

```bash
vercel deploy
```

After deploying:

- Add all env vars in the Vercel dashboard
- Enable the `charge.refunded` event in your Stripe webhook settings
- Set up the Vercel Cron for stock reservation expiry (configured in `vercel.json`)
- Set an admin user: add `{ "role": "admin" }` to a user's `publicMetadata` in Clerk

---

## Project Structure

```
src/
├── app/                  # Next.js App Router (pages, API routes, layouts)
│   ├── (storefront)/     # Customer-facing pages
│   ├── admin/            # Admin dashboard
│   └── api/              # API routes (webhooks, cron, etc.)
├── components/           # React components (admin + storefront)
├── db/                   # Drizzle schema, migrations, seed
├── emails/               # React Email templates
├── lib/                  # Utilities, validators, helpers
├── server/               # Server actions and queries
└── types/                # Shared TypeScript types
```

---

## Project Status

SwiftCard is a **v1 MVP**. It powers a real store and handles real transactions, but it's still early. The codebase is actively developed and some edges are rough.

What works well:

- Full purchase flow from browse to checkout to fulfillment
- Admin dashboard with real business operations (refunds, fulfillment, discounts)
- Caching, security headers, i18n, testing

What's still in progress:

- Some Drizzle schema type ergonomics could be improved
- Analytics dashboard is not yet built
- Docker deployment is not yet supported
- Documentation is minimal

If you're evaluating this for a production store, expect to spend time understanding the codebase and adapting it to your needs. That's the trade-off for full ownership.

---

## Roadmap

- **Order Management Enhancements** — activity log, bulk actions, order editing, CSV export, advanced filters
- **Analytics & Reporting** — sales charts, product performance, refund/discount analytics
- **Customer Experience** — wishlists, product reviews, back-in-stock notifications, improved search
- **Docker Support** — `docker-compose` setup for fully self-hosted deployments without Vercel
- **Setup CLI** — guided onboarding that provisions env vars and seeds data
- **Extended Customization** — theme system, configurable checkout flow

See the full roadmap in the project documentation.

---

## Contributing

Contributions are welcome. Open an issue first for anything non-trivial so we can discuss the approach.

```bash
bun test          # Unit tests
bun run typecheck # Type checking
bun run lint      # Linting
bun test:e2e      # E2E tests (requires running dev server)
```

---

## License

MIT — use it for anything.
