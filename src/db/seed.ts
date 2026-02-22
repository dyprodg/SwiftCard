import { db } from "./index";
import {
  categories,
  products,
  productVariants,
  productImages,
  shopSettings,
} from "./schema";
import { createId } from "@paralleldrive/cuid2";

async function seed() {
  console.log("Seeding database...");

  // Categories
  const [clothing, accessories] = await db
    .insert(categories)
    .values([
      { id: createId(), name: "Clothing", slug: "clothing" },
      { id: createId(), name: "Accessories", slug: "accessories" },
    ])
    .returning();

  // Products
  const [tshirt, hoodie, cap] = await db
    .insert(products)
    .values([
      {
        id: createId(),
        name: "Classic T-Shirt",
        slug: "classic-t-shirt",
        description: "A comfortable everyday t-shirt made from 100% organic cotton.",
        basePrice: 2990,
        status: "ACTIVE",
        featured: true,
        categoryId: clothing.id,
        publishedAt: new Date(),
      },
      {
        id: createId(),
        name: "Premium Hoodie",
        slug: "premium-hoodie",
        description: "Stay warm and stylish with our premium hoodie.",
        basePrice: 7990,
        status: "ACTIVE",
        featured: true,
        categoryId: clothing.id,
        publishedAt: new Date(),
      },
      {
        id: createId(),
        name: "Snapback Cap",
        slug: "snapback-cap",
        description: "Classic snapback cap with adjustable strap.",
        basePrice: 2490,
        status: "ACTIVE",
        featured: false,
        categoryId: accessories.id,
        publishedAt: new Date(),
      },
    ])
    .returning();

  // Variants for T-Shirt
  await db.insert(productVariants).values([
    { sku: "TS-S-BLK", size: "S", color: "Black", stock: 50, productId: tshirt.id },
    { sku: "TS-M-BLK", size: "M", color: "Black", stock: 75, productId: tshirt.id },
    { sku: "TS-L-BLK", size: "L", color: "Black", stock: 60, productId: tshirt.id },
    { sku: "TS-M-WHT", size: "M", color: "White", stock: 40, productId: tshirt.id },
    { sku: "TS-L-WHT", size: "L", color: "White", stock: 35, productId: tshirt.id },
  ]);

  // Variants for Hoodie
  await db.insert(productVariants).values([
    { sku: "HD-M-GRY", size: "M", color: "Grey", stock: 30, productId: hoodie.id },
    { sku: "HD-L-GRY", size: "L", color: "Grey", stock: 25, productId: hoodie.id },
    { sku: "HD-XL-GRY", size: "XL", color: "Grey", stock: 20, productId: hoodie.id },
  ]);

  // Variants for Cap
  await db.insert(productVariants).values([
    { sku: "CAP-BLK", color: "Black", stock: 100, productId: cap.id },
    { sku: "CAP-NVY", color: "Navy", stock: 80, productId: cap.id },
  ]);

  // Placeholder images
  await db.insert(productImages).values([
    {
      url: "https://placehold.co/800x800/333/white?text=T-Shirt",
      alt: "Classic T-Shirt",
      position: 0,
      productId: tshirt.id,
    },
    {
      url: "https://placehold.co/800x800/555/white?text=Hoodie",
      alt: "Premium Hoodie",
      position: 0,
      productId: hoodie.id,
    },
    {
      url: "https://placehold.co/800x800/222/white?text=Cap",
      alt: "Snapback Cap",
      position: 0,
      productId: cap.id,
    },
  ]);

  // Shop Settings
  await db.insert(shopSettings).values({
    id: "singleton",
    shopName: "SwiftCard",
    contactEmail: "info@swiftcard.ch",
    defaultShippingCost: 990,
    freeShippingThreshold: 10000,
    defaultTaxRate: 0.081,
    currency: "CHF",
  });

  console.log("Seed complete.");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
