# SwiftCart - E-Commerce Boilerplate

## Professional Next.js E-Commerce Platform

**Version:** 1.0
**Created:** February 2026
**Author:** Dennis Diepolder

---

## Project Overview

**SwiftCart** is a production-ready e-commerce boilerplate that combines modern best practices, full customization, and enterprise-level features.

### Core Features

- Full-Stack Next.js 14 (App Router, Server Components)
- Multi-Variant Products (Sizes, Colors, etc.)
- Custom Stripe Payment & Order Flow
- Fully customizable Admin Panel
- Multi-Language Support
- SEO-optimized
- GDPR compliant
- Transaction-safe Order Pipeline
- Enterprise-level Security

---

## Tech Stack

### Frontend

- **Framework:** Next.js latest (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui
- **State Management:** Zustand (for Client-State), React Server Components (for Server-State)
- **Forms:** React Hook Form + Zod Validation

### Backend

- **Runtime:** Node.js (Next.js API Routes)
- **ORM:** Prisma
- **Database:** PostgreSQL 16.x
- **Caching:** Redis (optional for Session/Cart)
- **File Upload:** Uploadthing or S3

### Authentication & Payments

- **Auth:** Clerk
- **Payments:** Stripe (Payment Intents API)
- **Webhooks:** Stripe Webhooks for secure order confirmation

### Infrastructure

- **Deployment:** Vercel (recommended) or Docker
- **Database Hosting:** Supabase, Railway, or Neon
- **CDN:** Vercel Edge Network
- **Email:** Resend or SendGrid

### Developer Tools

- **Package Manager:** pnpm
- **Linting:** ESLint + Prettier
- **Type Checking:** TypeScript strict mode
- **Testing:** Vitest + Playwright (optional)
- **Git Hooks:** Husky + lint-staged

---

## Project Structure

```
swiftcart/
├── src/
│   ├── app/
│   │   ├── (storefront)/          # Customer-facing pages
│   │   │   ├── page.tsx            # Homepage
│   │   │   ├── products/
│   │   │   │   ├── page.tsx        # Product listing
│   │   │   │   └── [slug]/
│   │   │   │       └── page.tsx    # Product detail
│   │   │   ├── cart/
│   │   │   │   └── page.tsx
│   │   │   ├── checkout/
│   │   │   │   ├── page.tsx
│   │   │   │   └── success/
│   │   │   │       └── page.tsx
│   │   │   └── layout.tsx          # Storefront layout
│   │   ├── (admin)/                # Admin panel
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx
│   │   │   ├── products/
│   │   │   │   ├── page.tsx        # Product management
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── [id]/
│   │   │   │       └── edit/
│   │   │   │           └── page.tsx
│   │   │   ├── orders/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx
│   │   │   ├── customers/
│   │   │   ├── settings/
│   │   │   │   ├── general/
│   │   │   │   ├── shipping/
│   │   │   │   ├── payment/
│   │   │   │   └── legal/
│   │   │   └── layout.tsx          # Admin layout
│   │   ├── api/
│   │   │   ├── webhooks/
│   │   │   │   └── stripe/
│   │   │   │       └── route.ts    # Stripe webhook handler
│   │   │   ├── checkout/
│   │   │   │   └── route.ts
│   │   │   └── products/
│   │   ├── [locale]/               # i18n routes
│   │   └── layout.tsx              # Root layout
│   ├── components/
│   │   ├── ui/                     # shadcn components
│   │   ├── storefront/             # Customer components
│   │   │   ├── ProductCard.tsx
│   │   │   ├── ProductGrid.tsx
│   │   │   ├── CartSheet.tsx
│   │   │   └── ...
│   │   ├── admin/                  # Admin components
│   │   │   ├── DataTable.tsx
│   │   │   ├── ProductForm.tsx
│   │   │   └── ...
│   │   └── shared/                 # Shared components
│   ├── lib/
│   │   ├── db/
│   │   │   └── prisma.ts           # Prisma client
│   │   ├── stripe/
│   │   │   ├── client.ts
│   │   │   └── webhooks.ts
│   │   ├── validations/            # Zod schemas
│   │   ├── utils/
│   │   └── constants/
│   ├── server/
│   │   ├── actions/                # Server Actions
│   │   │   ├── products.ts
│   │   │   ├── orders.ts
│   │   │   └── cart.ts
│   │   └── queries/                # Database queries
│   ├── types/
│   │   └── index.ts
│   ├── i18n/
│   │   ├── locales/
│   │   │   ├── de.json
│   │   │   └── en.json
│   │   └── config.ts
│   └── middleware.ts               # Auth + i18n middleware
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── public/
│   ├── images/
│   └── ...
├── .env.example
├── .env.local
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

---

## Database Schema (Prisma)

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ==================== PRODUCTS ====================

model Product {
  id          String   @id @default(cuid())
  name        String
  slug        String   @unique
  description String?  @db.Text

  // Price in smallest currency unit (cents)
  basePrice   Int

  // SEO
  metaTitle       String?
  metaDescription String?

  // Status
  status      ProductStatus @default(DRAFT)
  featured    Boolean       @default(false)

  // Timestamps
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  publishedAt DateTime?

  // Relations
  category    Category?      @relation(fields: [categoryId], references: [id])
  categoryId  String?

  images      ProductImage[]
  variants    ProductVariant[]
  orderItems  OrderItem[]

  // i18n
  translations ProductTranslation[]

  @@index([slug])
  @@index([status])
  @@index([categoryId])
}

enum ProductStatus {
  DRAFT
  ACTIVE
  ARCHIVED
}

model ProductImage {
  id        String   @id @default(cuid())
  url       String
  alt       String?
  position  Int      @default(0)

  product   Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  productId String

  createdAt DateTime @default(now())

  @@index([productId])
}

model ProductVariant {
  id          String   @id @default(cuid())
  sku         String   @unique

  // Variant attributes
  size        String?
  color       String?
  material    String?

  // Pricing (override base price if needed)
  priceAdjustment Int @default(0)

  // Inventory
  stock       Int      @default(0)

  // Status
  isAvailable Boolean  @default(true)

  product     Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  productId   String

  orderItems  OrderItem[]

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([productId])
  @@index([sku])
}

model Category {
  id          String    @id @default(cuid())
  name        String
  slug        String    @unique
  description String?

  parent      Category? @relation("CategoryHierarchy", fields: [parentId], references: [id])
  parentId    String?
  children    Category[] @relation("CategoryHierarchy")

  products    Product[]

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([slug])
  @@index([parentId])
}

model ProductTranslation {
  id          String @id @default(cuid())
  locale      String

  name        String
  description String? @db.Text

  product     Product @relation(fields: [productId], references: [id], onDelete: Cascade)
  productId   String

  @@unique([productId, locale])
  @@index([locale])
}

// ==================== ORDERS ====================

model Order {
  id              String      @id @default(cuid())
  orderNumber     String      @unique

  // Status tracking
  status          OrderStatus @default(PENDING)
  paymentStatus   PaymentStatus @default(PENDING)
  fulfillmentStatus FulfillmentStatus @default(UNFULFILLED)

  // Pricing
  subtotal        Int         // Product total
  tax             Int         // Tax amount
  shipping        Int         // Shipping cost
  total           Int         // Final total

  currency        String      @default("CHF")

  // Customer info
  customerId      String?
  customerEmail   String

  // Shipping address
  shippingName    String
  shippingAddress1 String
  shippingAddress2 String?
  shippingCity    String
  shippingZip     String
  shippingCountry String

  // Billing address (optional, can be same as shipping)
  billingName     String?
  billingAddress1 String?
  billingAddress2 String?
  billingCity     String?
  billingZip      String?
  billingCountry  String?

  // Payment
  stripePaymentIntentId String? @unique

  // Notes
  customerNote    String?     @db.Text
  internalNote    String?     @db.Text

  // Items
  items           OrderItem[]

  // Timestamps
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  paidAt          DateTime?
  shippedAt       DateTime?
  deliveredAt     DateTime?
  cancelledAt     DateTime?

  @@index([orderNumber])
  @@index([customerId])
  @@index([status])
  @@index([createdAt])
}

enum OrderStatus {
  PENDING
  CONFIRMED
  PROCESSING
  SHIPPED
  DELIVERED
  CANCELLED
  REFUNDED
}

enum PaymentStatus {
  PENDING
  PAID
  FAILED
  REFUNDED
}

enum FulfillmentStatus {
  UNFULFILLED
  PARTIALLY_FULFILLED
  FULFILLED
  RETURNED
}

model OrderItem {
  id          String  @id @default(cuid())

  order       Order   @relation(fields: [orderId], references: [id], onDelete: Cascade)
  orderId     String

  product     Product @relation(fields: [productId], references: [id])
  productId   String

  variant     ProductVariant? @relation(fields: [variantId], references: [id])
  variantId   String?

  // Snapshot of product data at time of order
  productName String
  variantName String?

  quantity    Int
  unitPrice   Int     // Price per item at time of order
  total       Int     // quantity * unitPrice

  @@index([orderId])
  @@index([productId])
}

// ==================== SETTINGS ====================

model ShopSettings {
  id              String @id @default("singleton")

  // General
  shopName        String
  shopDescription String?
  contactEmail    String

  // Legal
  termsUrl        String?
  privacyUrl      String?
  imprintUrl      String?

  // Shipping
  freeShippingThreshold Int?
  defaultShippingCost   Int

  // Tax
  defaultTaxRate  Float  @default(0.081) // 8.1% for Switzerland

  // Currency
  currency        String @default("CHF")

  // Features
  allowGuestCheckout Boolean @default(true)

  updatedAt       DateTime @updatedAt
}

// ==================== ANALYTICS (Optional) ====================

model PageView {
  id        String   @id @default(cuid())
  path      String
  userAgent String?
  createdAt DateTime @default(now())

  @@index([path])
  @@index([createdAt])
}
```

---

## Security & GDPR Compliance

### Authentication & Authorization

- **Clerk** for User Management
- Role-based Access Control (RBAC)
  - `CUSTOMER` - Can place orders
  - `ADMIN` - Full access to admin panel
  - `STAFF` - Limited admin access

### Payment Security

- **Stripe Payment Intents** (PCI compliant)
- Webhook signature verification
- Idempotency keys for retry-safe operations
- No credit card data stored locally

### Data Protection (GDPR)

1. **Data Minimization**
   - Only collect necessary data
   - Optional fields where possible

2. **User Rights**
   - Data export functionality
   - Account deletion (GDPR Art. 17)
   - Consent management

3. **Privacy**
   - Cookie consent banner
   - Privacy Policy page
   - Data retention policies

4. **Encryption**
   - TLS/HTTPS enforced
   - Sensitive data encrypted at rest
   - Secure session management

### Transaction Safety

- **Optimistic Locking** for Inventory
- **Database Transactions** for Order creation
- **Webhook Retry Logic** with Exponential Backoff
- **Order Status State Machine** (no invalid transitions)

---

## Internationalization (i18n)

### Supported Languages (Initial)

- German
- English

### Implementation

```typescript
// src/i18n/config.ts
export const i18n = {
  defaultLocale: "de",
  locales: ["de", "en"],
} as const;

export type Locale = (typeof i18n)["locales"][number];
```

### Features

- URL-based locale (`/de/products`, `/en/products`)
- Language switcher in header
- Product translations in database
- Auto-detect user language (fallback to default)

---

## Core Features - Detailed Breakdown

### 1. Product Management (Admin)

**Create/Edit Products**

- Basic Info (Name, Description, Price)
- Multiple Images (drag & drop, reorder)
- SEO fields (Meta Title, Meta Description)
- Category assignment
- Status (Draft/Active/Archived)
- Featured toggle

**Product Variants**

- Add unlimited variants (Size, Color, Material, etc.)
- Individual SKU per variant
- Stock management per variant
- Price adjustments per variant
- Variant availability toggle

**Bulk Operations**

- Import products via CSV
- Bulk price update
- Bulk status change
- Bulk delete

### 2. Order Management (Admin)

**Order Dashboard**

- Recent orders list
- Filter by status, date range, customer
- Search by order number, email
- Export to CSV

**Order Details**

- Full order information
- Customer details
- Order items with variants
- Payment status
- Fulfillment tracking
- Internal notes
- Status updates (with email notifications)

**Order Flow**

1. Customer places order → Status: PENDING
2. Payment confirmed via webhook → Status: CONFIRMED, PaymentStatus: PAID
3. Admin processes → Status: PROCESSING
4. Order shipped → Status: SHIPPED, email sent
5. Delivered → Status: DELIVERED

### 3. Checkout Flow (Customer)

**Cart**

- Add to cart (with variant selection)
- Update quantities
- Remove items
- Persistent cart (localStorage + DB for logged-in users)
- Mini cart in header

**Checkout Steps**

1. **Shipping Information**
   - Name, Address, City, ZIP, Country
   - Validation with Zod

2. **Shipping Method**
   - Standard shipping
   - Express shipping (if configured)
   - Free shipping threshold message

3. **Payment**
   - Stripe Embedded Checkout or Payment Element
   - Guest checkout option
   - Save payment method (for logged-in users)

4. **Review & Confirm**
   - Order summary
   - Final total
   - Terms & Conditions acceptance

5. **Payment Processing**
   - Stripe Payment Intent creation
   - 3D Secure handling
   - Webhook confirmation

6. **Success**
   - Order confirmation page
   - Email confirmation
   - Order tracking link

### 4. Customer Features

**Product Browsing**

- Product grid with filters (Category, Price, Size, Color)
- Search functionality
- Sorting (Price, Name, Newest)
- Product detail page with image gallery
- Variant selector (with stock indication)
- Related products

**Account**

- Order history
- Address book
- Payment methods (via Stripe)
- Account settings

### 5. SEO Optimization

**Technical SEO**

- Semantic HTML
- Proper heading hierarchy
- Alt tags on all images
- Structured data (JSON-LD)
  - Product schema
  - BreadcrumbList schema
  - Organization schema

**Performance**

- Next.js Image Optimization
- Server Components (no client JS for static content)
- Lazy loading
- Route prefetching

**Metadata**

- Dynamic meta tags per page
- Open Graph tags
- Twitter Card tags
- Canonical URLs

---

## Implementation Roadmap

### Phase 1: Foundation (Week 1-2)

- [ ] Project setup (Next.js, TypeScript, Tailwind)
- [ ] Database setup (Prisma + PostgreSQL)
- [ ] shadcn/ui components installation
- [ ] Clerk authentication setup
- [ ] Basic routing structure
- [ ] Environment variables configuration

### Phase 2: Product System (Week 2-3)

- [ ] Product model & migrations
- [ ] Product listing page
- [ ] Product detail page
- [ ] Product variant selector
- [ ] Image upload (Uploadthing)
- [ ] Admin product management
  - [ ] Create product
  - [ ] Edit product
  - [ ] Variant management
  - [ ] Image management

### Phase 3: Cart & Checkout (Week 3-4)

- [ ] Cart functionality (add/update/remove)
- [ ] Cart persistence
- [ ] Checkout flow
  - [ ] Shipping form
  - [ ] Shipping method selection
  - [ ] Payment integration (Stripe)
  - [ ] Order review
- [ ] Order creation logic
- [ ] Stripe webhook handler
- [ ] Order confirmation email

### Phase 4: Order Management (Week 4-5)

- [ ] Admin order dashboard
- [ ] Order detail page
- [ ] Order status updates
- [ ] Customer order history
- [ ] Email notifications

### Phase 5: Admin Panel (Week 5-6)

- [ ] Dashboard with metrics
- [ ] Settings pages
  - [ ] General settings
  - [ ] Shipping settings
  - [ ] Legal pages management
- [ ] Customer management
- [ ] Analytics (basic)

### Phase 6: i18n & SEO (Week 6-7)

- [ ] i18n setup (next-intl or similar)
- [ ] Translations (DE/EN)
- [ ] SEO metadata
- [ ] Structured data
- [ ] Sitemap generation

### Phase 7: Polish & Security (Week 7-8)

- [ ] GDPR compliance
  - [ ] Cookie consent
  - [ ] Privacy policy
  - [ ] Data export
  - [ ] Account deletion
- [ ] Security audit
- [ ] Error handling
- [ ] Loading states
- [ ] Form validations
- [ ] Testing

### Phase 8: Deployment & Documentation (Week 8)

- [ ] Vercel deployment
- [ ] Database migration to production
- [ ] Environment variables setup
- [ ] README documentation
- [ ] API documentation
- [ ] Admin user guide

---

## Development Guidelines

### Next.js Best Practices

**Server Components (default)**

```typescript
// app/products/page.tsx
export default async function ProductsPage() {
  const products = await db.product.findMany();

  return <ProductGrid products={products} />;
}
```

**Client Components (when needed)**

```typescript
"use client";

export function ProductVariantSelector() {
  const [selected, setSelected] = useState();
  // Interactive logic here
}
```

**Server Actions**

```typescript
// server/actions/products.ts
"use server";

export async function createProduct(data: ProductInput) {
  const user = await currentUser();
  if (!user || user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  return await db.product.create({ data });
}
```

### Routing Strategy

**Nested Routes**

```
/products                    → Product listing
/products/[slug]             → Product detail
/products/category/[slug]    → Category listing
```

**Route Groups**

```
/(storefront)/               → Customer pages
/(admin)/                    → Admin pages
/[locale]/                   → i18n routes
```

### Data Fetching

**Prefer Server Components**

- Fetch data on server
- No loading spinners needed
- Better SEO

**Use Suspense for Streaming**

```tsx
<Suspense fallback={<ProductSkeleton />}>
  <ProductList />
</Suspense>
```

### Error Handling

**error.tsx for Error Boundaries**

```tsx
// app/products/error.tsx
"use client";

export default function ProductsError({ error, reset }) {
  return (
    <div>
      <h2>Error loading products</h2>
      <button onClick={reset}>Try again</button>
    </div>
  );
}
```

---

## Design System (shadcn/ui)

### Core Components Needed

- Button
- Input, Textarea
- Select, Combobox
- Dialog, Sheet
- Form (with react-hook-form)
- Table, DataTable
- Card
- Badge
- Dropdown Menu
- Toast
- Tabs
- Accordion
- Separator
- Avatar
- Skeleton

### Custom Components

- ProductCard
- ProductGrid
- VariantSelector
- CartSheet
- CheckoutSteps
- OrderStatusBadge
- DataTable with server-side pagination

---

## Testing Strategy

### Unit Tests (Vitest)

- Utility functions
- Validation schemas
- Server actions

### Integration Tests (Playwright)

- Complete checkout flow
- Product creation
- Order management

### E2E Critical Paths

1. Browse → Add to cart → Checkout → Payment
2. Admin: Create product → Receive order → Update status

---

## Analytics & Monitoring

### Basic Analytics

- Page views
- Product views
- Cart abandonment rate
- Conversion rate
- Revenue tracking

### Error Monitoring

- Sentry integration (optional)
- Error logging
- Performance monitoring

---

## Deployment

### Vercel Deployment

**Prerequisites**

- GitHub repository
- Vercel account
- PostgreSQL database (Supabase/Neon/Railway)

**Environment Variables**

```env
# Database
DATABASE_URL=

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Upload
UPLOADTHING_SECRET=
UPLOADTHING_APP_ID=

# App
NEXT_PUBLIC_APP_URL=https://swiftcart.com
```

**Deployment Steps**

1. Push to GitHub
2. Import to Vercel
3. Configure environment variables
4. Deploy
5. Run migrations: `npx prisma migrate deploy`
6. Seed database: `npx prisma db seed`

---

## Post-Launch Checklist

### Pre-Production

- [ ] All environment variables set
- [ ] Database migrations run
- [ ] Stripe webhooks configured
- [ ] Email service configured
- [ ] Admin user created
- [ ] Test order placed successfully

### Production

- [ ] SSL certificate active
- [ ] Custom domain configured
- [ ] Analytics tracking active
- [ ] Error monitoring active
- [ ] Backup strategy in place

### Legal & Compliance

- [ ] Privacy Policy published
- [ ] Terms & Conditions published
- [ ] Imprint published
- [ ] Cookie consent banner active
- [ ] GDPR compliance verified

---

## Success Metrics

### Portfolio Showcasing

- Clean, modern design
- Fast loading times (<2s)
- Mobile responsive
- Complete feature set
- Production-ready code quality

### Technical Metrics

- Lighthouse score >90
- No TypeScript errors
- No accessibility warnings
- Full test coverage (if implementing tests)

---

## Additional Resources

### Documentation Links

- [Next.js Docs](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [Stripe Docs](https://stripe.com/docs)
- [Clerk Docs](https://clerk.com/docs)
- [shadcn/ui](https://ui.shadcn.com)

### Useful Libraries

- `zod` - Schema validation
- `react-hook-form` - Form handling
- `zustand` - Client state
- `date-fns` - Date manipulation
- `slugify` - URL-safe slugs
- `uploadthing` - File uploads
- `resend` - Email sending

---

## Next Steps

1. Review this plan
2. Set up development environment
3. Create GitHub repository
4. Initialize Next.js project
5. Start with Phase 1

**Ready to start? Let's build SwiftCart!**
