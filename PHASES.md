# SwiftCard — Phase Plan

> Last updated: 2026-02-25

---

## Completed Phases

### Phase 1–4: Core Foundation (pre-tracked)

- Project scaffolding (Next.js 16, Bun, TypeScript strict, Drizzle ORM, Supabase)
- Product catalog (CRUD, images via Vercel Blob, variants, categories)
- Shopping cart (Vercel KV, Zustand store)
- Basic storefront layout + product pages

### Phase 5: Payment & Admin

- Stripe checkout (PaymentIntents, webhooks), order creation
- Stripe reconciliation, retry-payment flow
- Resend email (order confirmation, test mode), order status polling
- Admin dashboard, settings (Edge Config), customer management
- Clerk auth with admin role via `publicMetadata`

### Phase 6: i18n & SEO (`1c778c6`)

- next-intl (DE/EN), locale switcher
- `generateMetadata()` on all pages, sitemap.xml, JSON-LD structured data

### Phase 7: GDPR, Security & Polish

- CSP/HSTS security headers, rate limiting (Vercel KV)
- Cookie consent banner, legal pages (privacy, terms, imprint)
- Error boundaries, GDPR data export/deletion

### Phase 8: Testing & CI (`a1749d0`)

- Vitest unit tests (175+), Playwright E2E basics, GitHub Actions CI

### Phase 9: Performance Optimization (`e620b01`)

- `"use cache"` on queries (products, featured, categories, shop-settings, sitemap)
- `updateTag()` in server actions for on-demand cache invalidation
- Removed `force-dynamic` from 8 routes, Suspense boundaries + skeletons

### Phase 10: Stripe Refunds & Partial Refunds

- `order_refunds` + `order_refund_items` tables, `refund_reason` enum, `PARTIALLY_REFUNDED` status
- `processRefund` server action, admin refund dialog (3 tabs), refund history
- `charge.refunded` webhook, refund notification email, stock restoration toggle
- Migration: `0002_*.sql`

### Phase 11: Discount & Promotion System + Per-item Display (`5592de0`)

- `discounts`, `discount_products`, `discount_categories` tables
- Percentage (basis points), fixed (cents), free shipping discount types
- Coupon input (cart + checkout), automatic discount detection, event banner
- Per-item discount display: strikethrough + discounted price on variant selector, cart, checkout
- `getItemDiscount()` helper, `AutoDiscountDetector` component
- 28 unit tests, migration: `0003_pale_bastion.sql`

### Phase 12: Stock Reservation System (`6d830c4`)

- `stock_reservations` table, RESERVED → CONVERTED/EXPIRED lifecycle
- Vercel cron (`/api/cron/expire-reservations`, every 5 min)
- "Only X left" (orange, ≤5) on variant selector, admin reservations page
- Edge Config reservation timeout (default 15 min)
- 6 unit tests, migration: `0004_dizzy_mesmero.sql`

### Phase 13: Shipping & Fulfillment (`a7f8121`)

- `order_fulfillments` table, carriers: Swiss Post, DHL, UPS
- Partial fulfillment, packing slips (`/admin/orders/[id]/packing-slip`)
- Customer tracking view, shipping notification emails, duplicate email guard
- 29 unit tests, migration: `0005_clear_blindfold.sql`

### Phase 14: Order Management Enhancements (`b800ca1`)

- `order_events` audit log (9 event types), activity log timeline UI
- Bulk status update, order editing (address + note), CSV export
- Enhanced filters (fulfillment status, date range, amount range)
- Checkbox selection, bulk action bar, export button
- 25 unit tests (285 total), migration: `0006_brown_tattoo.sql`

### Phase 15: Analytics & Reporting (`b38f300`)

- `/admin/analytics` — 5 tabs: Overview, Products, Refunds, Discounts, Customers
- recharts: area charts, bar chart, pie charts
- Date range presets (7D/30D/90D/1Y/All), auto-granularity, period-over-period deltas
- 10 SQL query functions, no new DB tables
- 20 unit tests (305 total)

### Phase 16: Customer Experience Polish (`febe0fc`)

- 3 new tables: `wishlists`, `product_reviews`, `stock_notifications`
- Wishlist (DB-backed, heart icon), product reviews (moderation), back-in-stock emails
- Search bar (debounced, dropdown), recently viewed (Zustand localStorage)
- Admin `/admin/reviews` page
- 29 unit tests (334 total), migration: `0007_smart_talkback.sql`

### Phase 17: Customer Profiles, Addresses & Abandoned Cart Recovery (`e6c5ca9`)

- 2 new tables: `customer_addresses`, `abandoned_carts`; `orders.phone` column
- Address book CRUD, checkout auto-fill, account dashboard with sidebar nav
- Abandoned cart recovery (cron every 30 min, email, restore link)
- Admin customer detail, admin abandoned carts page
- Stripe webhook hardening (disputes, canceled intents)
- 12 unit tests (346 total), migrations: `0008_*.sql` + `0009_*.sql`

### Phase 18: Shipping Zones & Tax Configuration (`d6e0c5e`)

- 3 new tables: `shipping_zones`, `shipping_rates`, `tax_zones`
- FLAT/WEIGHT_BASED/PRICE_BASED rates, per-zone free shipping thresholds
- Tax zones with country-based rates, default zone fallback
- Checkout shipping method selector, zone-based tax calculation
- Admin CRUD for shipping + tax zones, product form weight field
- 28 unit tests (374 total), migration: `0010_yellow_junta.sql`

### Phase 19: Draft Orders & Admin Sales (`09888a5`)

- `DRAFT` order status, payment links via Stripe Checkout Sessions (24h expiry)
- Admin create/edit draft, product search, line items, send payment link dialog
- Webhook: `checkout.session.completed` + `checkout.session.expired`
- Payment link email template
- 24 unit tests (398 total), migration: `0011_outstanding_ben_grimm.sql`

### Phase 20: Customer Returns Portal (`a9eb5af`)

- `returns` + `return_items` tables, REQUESTED → APPROVED → RECEIVED → REFUNDED lifecycle
- Customer self-service return request (within configurable window)
- Admin returns list + detail (approve/reject/receive/refund)
- Refund integration reuses existing Stripe refund system
- Edge Config: `returnSettings` (window days, enabled)
- 3 email templates, 24 unit tests (422 total), migration: `0012_harsh_namora.sql`

### Tax-Inclusive Pricing & CH/DE Defaults (`b5bed25`)

- `taxInclusive` boolean on `taxZones` and `orders`
- Inclusive: extract tax from price; Exclusive: add on top
- Pre-built profiles: CH (8.1%) + DE (19%) tax, CH/DE shipping defaults
- "Load CH/DE Defaults" buttons on empty tax/shipping pages
- 10 unit tests (432 total), migration: `0013_silent_legion.sql`

### Phase 21: Gift Cards, Bundles, Bulk Import/Export, Email Marketing, Subscriptions (`f689760`)

- Gift cards: sell, redeem at checkout, email delivery, balance check, admin management
- Product bundles: grouped products with bundle pricing
- Bulk import/export: CSV product import/export for admin
- Email marketing: automated campaigns, send via Resend
- Subscriptions: recurring product subscriptions
- Feature flags: admin-toggleable (bundles, gift cards, subscriptions) via Edge Config

### Phase 21b: Comprehensive E2E Testing (`6a17359`, `06296d8`)

- 176 Playwright tests across 36 spec files (public 86, customer 18, admin 72)
- `@clerk/testing` integration: `clerkSetup()` + `setupClerkTestingToken()`
- 4 Playwright projects: `auth-setup` → `public`, `customer`, `admin`
- Clerk Backend API sign-in tokens for auth bypass
- Total: 432 unit + 176 E2E = **608 tests**

---

## Future Phases (not started)

### Phase 22: Blog & Custom Pages (CMS-lite)

**Goal:** Content marketing and custom landing pages.

**Schema:**

- `pages` table: id, slug, title, content (rich text/MDX), type (page/blog), status, publishedAt, authorId, metaTitle, metaDescription
- `page_translations` table: id, pageId, locale, title, content

**Features:**

- Rich text editor for admin (Tiptap or similar)
- Blog with listing page, individual post pages, categories/tags
- Custom pages (about, FAQ, etc.) with unique slugs
- SEO metadata per page, sitemap inclusion
- i18n translations for all content

### Phase 23: Portability Layer

**Goal:** Make SwiftCard deployable anywhere — Docker, AWS, Railway, Fly.io.

**Features:**

- Abstract storage interface (Vercel Blob → S3/local/Cloudflare R2)
- Abstract KV interface (Vercel KV → Redis/Upstash/in-memory)
- Abstract config interface (Edge Config → env vars/DB config)
- Docker Compose setup (app + Postgres + Redis + MinIO)
- Environment-based provider selection (`STORAGE_PROVIDER=s3|blob|local`)
- Cron abstraction (Vercel Cron → node-cron for Docker)
- Deployment guides: Vercel, Docker, Railway, Fly.io

---

## Phase Dependencies

```
Phases 1–21b: COMPLETED

Phase 22 (Blog/CMS) → standalone
Phase 23 (Portability) → standalone, best done last (wraps all integrations)
```

Phases 22–23 can be done in any order. Phase 23 should ideally be last.

---

## Tech Stack Summary

| Layer      | Technology                                                                |
| ---------- | ------------------------------------------------------------------------- |
| Framework  | Next.js 16.1, Bun runtime                                                 |
| Language   | TypeScript (strict)                                                       |
| ORM / DB   | Drizzle ORM + Supabase PostgreSQL                                         |
| Auth       | Clerk (admin via `publicMetadata.role`)                                   |
| Payments   | Stripe (checkout, refunds, disputes, payment links)                       |
| Email      | Resend                                                                    |
| Storage    | Vercel Blob (images), KV (carts/rate-limit), Edge Config (settings/flags) |
| i18n       | next-intl (DE/EN)                                                         |
| State      | Zustand                                                                   |
| Forms      | React Hook Form + Zod                                                     |
| UI         | shadcn/ui                                                                 |
| Charts     | recharts                                                                  |
| Testing    | Vitest (432 unit) + Playwright (176 E2E)                                  |
| Monitoring | Sentry                                                                    |

## DB Migrations

| Migration                        | Phase                                              |
| -------------------------------- | -------------------------------------------------- |
| `0001_*.sql`                     | Phase 1–5 (initial schema)                         |
| `0002_*.sql`                     | Phase 10 (refunds)                                 |
| `0003_pale_bastion.sql`          | Phase 11 (discounts)                               |
| `0004_dizzy_mesmero.sql`         | Phase 12 (stock reservations)                      |
| `0005_clear_blindfold.sql`       | Phase 13 (fulfillments)                            |
| `0006_brown_tattoo.sql`          | Phase 14 (order events)                            |
| `0007_smart_talkback.sql`        | Phase 16 (wishlists, reviews, stock notifications) |
| `0008_tense_korg.sql`            | Phase 17 (customer addresses)                      |
| `0009_crazy_quentin_quire.sql`   | Phase 17 (abandoned carts)                         |
| `0010_yellow_junta.sql`          | Phase 18 (shipping/tax zones)                      |
| `0011_outstanding_ben_grimm.sql` | Phase 19 (draft orders)                            |
| `0012_harsh_namora.sql`          | Phase 20 (returns)                                 |
| `0013_silent_legion.sql`         | Tax-inclusive pricing                              |
