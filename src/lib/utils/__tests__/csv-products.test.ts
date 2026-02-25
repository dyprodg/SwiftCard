import { describe, it, expect } from "vitest";
import {
  escapeCSV,
  parseCsvLine,
  parseCsvToRows,
  serializeProductsToCsv,
  validateCsvRows,
  groupRowsByProduct,
  generateCsvTemplate,
  type ProductCsvRow,
} from "../csv-products";
import type { ProductWithRelations } from "@/types";

// ==================== escapeCSV ====================

describe("escapeCSV", () => {
  it("returns plain strings unchanged", () => {
    expect(escapeCSV("hello")).toBe("hello");
  });

  it("wraps strings with commas in quotes", () => {
    expect(escapeCSV("hello, world")).toBe('"hello, world"');
  });

  it("escapes double quotes", () => {
    expect(escapeCSV('say "hi"')).toBe('"say ""hi"""');
  });

  it("wraps strings with newlines in quotes", () => {
    expect(escapeCSV("line1\nline2")).toBe('"line1\nline2"');
  });
});

// ==================== parseCsvLine ====================

describe("parseCsvLine", () => {
  it("parses simple comma-separated values", () => {
    expect(parseCsvLine("a,b,c")).toEqual(["a", "b", "c"]);
  });

  it("handles quoted fields with commas", () => {
    expect(parseCsvLine('a,"b, c",d')).toEqual(["a", "b, c", "d"]);
  });

  it("handles escaped quotes inside quoted fields", () => {
    expect(parseCsvLine('a,"say ""hi""",c')).toEqual(["a", 'say "hi"', "c"]);
  });

  it("handles empty fields", () => {
    expect(parseCsvLine("a,,c")).toEqual(["a", "", "c"]);
  });

  it("trims whitespace from fields", () => {
    expect(parseCsvLine(" a , b , c ")).toEqual(["a", "b", "c"]);
  });
});

// ==================== parseCsvToRows ====================

describe("parseCsvToRows", () => {
  const validCsv = [
    "product_id,name,slug,description,name_de,description_de,base_price,status,featured,category_slug,variant_sku,variant_size,variant_color,variant_material,variant_weight,variant_stock,variant_price_adjustment,image_urls",
    ",T-Shirt,t-shirt,A shirt,,Ein Shirt,2990,ACTIVE,true,clothing,TSH-M,M,Black,,200,50,0,",
  ].join("\n");

  it("parses a valid CSV with header and one data row", () => {
    const { rows, errors } = parseCsvToRows(validCsv);
    expect(errors).toHaveLength(0);
    expect(rows).toHaveLength(1);
    expect(rows[0].name).toBe("T-Shirt");
    expect(rows[0].basePrice).toBe(2990);
    expect(rows[0].status).toBe("ACTIVE");
    expect(rows[0].featured).toBe(true);
    expect(rows[0].variantSku).toBe("TSH-M");
    expect(rows[0].variantStock).toBe(50);
  });

  it("returns error for empty CSV", () => {
    const { errors } = parseCsvToRows("");
    expect(errors.length).toBeGreaterThan(0);
  });

  it("returns error for missing required headers", () => {
    const { errors } = parseCsvToRows("foo,bar\n1,2");
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].message).toContain("Missing required header");
  });

  it("returns error for invalid base_price", () => {
    const csv = ["name,base_price,variant_sku", "Test,abc,SKU-1"].join("\n");
    const { rows, errors } = parseCsvToRows(csv);
    expect(rows).toHaveLength(0);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].column).toBe("base_price");
  });

  it("returns error for negative stock", () => {
    const csv = ["name,base_price,variant_sku,variant_stock", "Test,1000,SKU-1,-5"].join(
      "\n",
    );
    const { rows, errors } = parseCsvToRows(csv);
    expect(rows).toHaveLength(0);
    expect(errors.length).toBeGreaterThan(0);
  });

  it("returns error for invalid status", () => {
    const csv = ["name,base_price,variant_sku,status", "Test,1000,SKU-1,INVALID"].join(
      "\n",
    );
    const { rows, errors } = parseCsvToRows(csv);
    expect(rows).toHaveLength(0);
    expect(errors[0].column).toBe("status");
  });

  it("defaults status to DRAFT when not provided", () => {
    const csv = ["name,base_price,variant_sku", "Test,1000,SKU-1"].join("\n");
    const { rows } = parseCsvToRows(csv);
    expect(rows[0].status).toBe("DRAFT");
  });

  it("parses featured as boolean from various values", () => {
    const csv = [
      "name,base_price,variant_sku,featured",
      "Test1,1000,SKU-1,true",
      "Test2,1000,SKU-2,false",
      "Test3,1000,SKU-3,1",
      "Test4,1000,SKU-4,yes",
    ].join("\n");
    const { rows } = parseCsvToRows(csv);
    expect(rows[0].featured).toBe(true);
    expect(rows[1].featured).toBe(false);
    expect(rows[2].featured).toBe(true);
    expect(rows[3].featured).toBe(true);
  });
});

// ==================== validateCsvRows ====================

describe("validateCsvRows", () => {
  const existingSkus = new Set(["EXISTING-SKU"]);
  const existingCategories = new Map([["clothing", "cat-1"]]);

  const makeRow = (overrides: Partial<ProductCsvRow> = {}): ProductCsvRow => ({
    name: "Test",
    basePrice: 1000,
    status: "DRAFT",
    featured: false,
    variantSku: "NEW-SKU",
    variantStock: 10,
    variantPriceAdjustment: 0,
    ...overrides,
  });

  it("returns no errors for valid rows", () => {
    const errors = validateCsvRows(
      [makeRow()],
      existingSkus,
      existingCategories,
      "CREATE_AND_UPDATE",
    );
    expect(errors).toHaveLength(0);
  });

  it("detects duplicate SKUs within the import", () => {
    const errors = validateCsvRows(
      [makeRow({ variantSku: "DUP" }), makeRow({ variantSku: "DUP", name: "Test2" })],
      existingSkus,
      existingCategories,
      "CREATE_AND_UPDATE",
    );
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toContain("Duplicate SKU");
  });

  it("detects invalid category slugs", () => {
    const errors = validateCsvRows(
      [makeRow({ categorySlug: "nonexistent" })],
      existingSkus,
      existingCategories,
      "CREATE_AND_UPDATE",
    );
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toContain("Category not found");
  });

  it("allows valid category slugs", () => {
    const errors = validateCsvRows(
      [makeRow({ categorySlug: "clothing" })],
      existingSkus,
      existingCategories,
      "CREATE_AND_UPDATE",
    );
    expect(errors).toHaveLength(0);
  });

  it("detects missing SKU for UPDATE_ONLY mode", () => {
    const errors = validateCsvRows(
      [makeRow({ variantSku: "UNKNOWN-SKU" })],
      existingSkus,
      existingCategories,
      "UPDATE_ONLY",
    );
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toContain("SKU not found");
  });
});

// ==================== groupRowsByProduct ====================

describe("groupRowsByProduct", () => {
  const makeRow = (overrides: Partial<ProductCsvRow> = {}): ProductCsvRow => ({
    name: "Test Product",
    slug: "test-product",
    basePrice: 1000,
    status: "DRAFT",
    featured: false,
    variantSku: "SKU-1",
    variantStock: 10,
    variantPriceAdjustment: 0,
    ...overrides,
  });

  it("groups rows with the same slug into one product", () => {
    const rows = [
      makeRow({ variantSku: "SKU-M", variantSize: "M" }),
      makeRow({ variantSku: "SKU-L", variantSize: "L" }),
    ];
    const groups = groupRowsByProduct(rows);
    expect(groups).toHaveLength(1);
    expect(groups[0].variants).toHaveLength(2);
    expect(groups[0].variants[0].sku).toBe("SKU-M");
    expect(groups[0].variants[1].sku).toBe("SKU-L");
  });

  it("separates rows with different slugs into different products", () => {
    const rows = [
      makeRow({ slug: "product-a", variantSku: "SKU-A" }),
      makeRow({ slug: "product-b", name: "Other", variantSku: "SKU-B" }),
    ];
    const groups = groupRowsByProduct(rows);
    expect(groups).toHaveLength(2);
  });

  it("groups by productId when present", () => {
    const rows = [
      makeRow({ productId: "pid-1", slug: "a", variantSku: "SKU-1" }),
      makeRow({ productId: "pid-1", slug: "a", variantSku: "SKU-2" }),
    ];
    const groups = groupRowsByProduct(rows);
    expect(groups).toHaveLength(1);
    expect(groups[0].variants).toHaveLength(2);
  });

  it("parses pipe-separated image URLs", () => {
    const rows = [makeRow({ imageUrls: "https://a.com/1.jpg|https://a.com/2.jpg" })];
    const groups = groupRowsByProduct(rows);
    expect(groups[0].imageUrls).toEqual(["https://a.com/1.jpg", "https://a.com/2.jpg"]);
  });
});

// ==================== serializeProductsToCsv ====================

describe("serializeProductsToCsv", () => {
  const makeProduct = (
    overrides: Partial<ProductWithRelations> = {},
  ): ProductWithRelations => ({
    id: "p1",
    name: "Test Product",
    slug: "test-product",
    description: "A description",
    basePrice: 2990,
    metaTitle: null,
    metaDescription: null,
    status: "ACTIVE",
    featured: false,
    categoryId: "c1",
    subscribable: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    publishedAt: new Date(),
    images: [],
    variants: [
      {
        id: "v1",
        sku: "TST-M",
        size: "M",
        color: "Black",
        material: null,
        weight: 200,
        stock: 50,
        priceAdjustment: 0,
        isAvailable: true,
        productId: "p1",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    category: {
      id: "c1",
      name: "Clothing",
      slug: "clothing",
      description: null,
      parentId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    translations: [
      {
        id: "t1",
        locale: "de",
        name: "Testprodukt",
        description: "Eine Beschreibung",
        productId: "p1",
      },
    ],
    ...overrides,
  });

  it("produces CSV with header row", () => {
    const csv = serializeProductsToCsv([makeProduct()]);
    const lines = csv.split("\n");
    expect(lines[0]).toContain("product_id");
    expect(lines[0]).toContain("name");
    expect(lines[0]).toContain("variant_sku");
  });

  it("creates one row per variant", () => {
    const product = makeProduct({
      variants: [
        {
          id: "v1",
          sku: "TST-M",
          size: "M",
          color: null,
          material: null,
          weight: null,
          stock: 50,
          priceAdjustment: 0,
          isAvailable: true,
          productId: "p1",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "v2",
          sku: "TST-L",
          size: "L",
          color: null,
          material: null,
          weight: null,
          stock: 30,
          priceAdjustment: 100,
          isAvailable: true,
          productId: "p1",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    });
    const csv = serializeProductsToCsv([product]);
    const lines = csv.split("\n");
    expect(lines).toHaveLength(3); // header + 2 variants
    expect(lines[1]).toContain("TST-M");
    expect(lines[2]).toContain("TST-L");
  });

  it("creates one row for products without variants", () => {
    const product = makeProduct({ variants: [] });
    const csv = serializeProductsToCsv([product]);
    const lines = csv.split("\n");
    expect(lines).toHaveLength(2); // header + 1 product row
  });

  it("includes DE translation", () => {
    const csv = serializeProductsToCsv([makeProduct()]);
    expect(csv).toContain("Testprodukt");
  });

  it("round-trips: serialize then parse", () => {
    const original = makeProduct();
    const csv = serializeProductsToCsv([original]);
    const { rows, errors } = parseCsvToRows(csv);
    expect(errors).toHaveLength(0);
    expect(rows).toHaveLength(1);
    expect(rows[0].name).toBe("Test Product");
    expect(rows[0].basePrice).toBe(2990);
    expect(rows[0].variantSku).toBe("TST-M");
  });
});

// ==================== generateCsvTemplate ====================

describe("generateCsvTemplate", () => {
  it("produces valid CSV with headers and example rows", () => {
    const csv = generateCsvTemplate();
    const { rows, errors } = parseCsvToRows(csv);
    expect(errors).toHaveLength(0);
    expect(rows.length).toBeGreaterThanOrEqual(2);
  });

  it("includes all required headers", () => {
    const csv = generateCsvTemplate();
    const header = csv.split("\n")[0];
    expect(header).toContain("name");
    expect(header).toContain("base_price");
    expect(header).toContain("variant_sku");
  });
});
