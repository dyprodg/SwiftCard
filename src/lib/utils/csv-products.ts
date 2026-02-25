import type { ProductWithRelations } from "@/types";

// ==================== TYPES ====================

export type ProductCsvRow = {
  productId?: string;
  name: string;
  slug?: string;
  description?: string;
  nameDE?: string;
  descriptionDE?: string;
  basePrice: number;
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
  featured: boolean;
  categorySlug?: string;
  variantSku: string;
  variantSize?: string;
  variantColor?: string;
  variantMaterial?: string;
  variantWeight?: number | null;
  variantStock: number;
  variantPriceAdjustment: number;
  imageUrls?: string;
};

export type CsvValidationError = {
  row: number;
  column: string;
  message: string;
};

export type CsvImportPreview = {
  rows: ProductCsvRow[];
  errors: CsvValidationError[];
  summary: {
    toCreate: number;
    toUpdate: number;
    unchanged: number;
  };
};

export type CsvImportResult = {
  created: number;
  updated: number;
  skipped: number;
  errors: CsvValidationError[];
};

// ==================== CSV HEADERS ====================

const CSV_HEADERS = [
  "product_id",
  "name",
  "slug",
  "description",
  "name_de",
  "description_de",
  "base_price",
  "status",
  "featured",
  "category_slug",
  "variant_sku",
  "variant_size",
  "variant_color",
  "variant_material",
  "variant_weight",
  "variant_stock",
  "variant_price_adjustment",
  "image_urls",
] as const;

// ==================== ESCAPING ====================

export function escapeCSV(val: string): string {
  if (val.includes(",") || val.includes('"') || val.includes("\n")) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}

function unescapeCSV(val: string): string {
  let v = val.trim();
  if (v.startsWith('"') && v.endsWith('"')) {
    v = v.slice(1, -1).replace(/""/g, '"');
  }
  return v;
}

// ==================== SERIALIZE (EXPORT) ====================

export function serializeProductsToCsv(products: ProductWithRelations[]): string {
  const rows: string[] = [CSV_HEADERS.join(",")];

  for (const product of products) {
    const deTranslation = product.translations.find((t) => t.locale === "de");
    const imageUrls = product.images.map((img) => img.url).join("|");

    if (product.variants.length === 0) {
      rows.push(
        [
          product.id,
          product.name,
          product.slug,
          product.description ?? "",
          deTranslation?.name ?? "",
          deTranslation?.description ?? "",
          String(product.basePrice),
          product.status,
          product.featured ? "true" : "false",
          product.category?.slug ?? "",
          "",
          "",
          "",
          "",
          "",
          "0",
          "0",
          imageUrls,
        ]
          .map(escapeCSV)
          .join(","),
      );
    } else {
      for (const variant of product.variants) {
        rows.push(
          [
            product.id,
            product.name,
            product.slug,
            product.description ?? "",
            deTranslation?.name ?? "",
            deTranslation?.description ?? "",
            String(product.basePrice),
            product.status,
            product.featured ? "true" : "false",
            product.category?.slug ?? "",
            variant.sku,
            variant.size ?? "",
            variant.color ?? "",
            variant.material ?? "",
            variant.weight != null ? String(variant.weight) : "",
            String(variant.stock),
            String(variant.priceAdjustment),
            imageUrls,
          ]
            .map(escapeCSV)
            .join(","),
        );
      }
    }
  }

  return rows.join("\n");
}

// ==================== PARSE (IMPORT) ====================

/**
 * Parse CSV text respecting quoted fields (commas inside quotes, escaped quotes).
 */
export function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        fields.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
  }
  fields.push(current.trim());

  return fields;
}

export function parseCsvToRows(csvText: string): {
  rows: ProductCsvRow[];
  errors: CsvValidationError[];
} {
  const errors: CsvValidationError[] = [];
  const rows: ProductCsvRow[] = [];

  const lines = csvText.split(/\r?\n/).filter((l) => l.trim() !== "");
  if (lines.length < 2) {
    errors.push({
      row: 0,
      column: "",
      message: "CSV must have a header row and at least one data row",
    });
    return { rows, errors };
  }

  // Validate header
  const headerFields = parseCsvLine(lines[0]).map((h) => h.toLowerCase().trim());
  const expectedHeaders = [...CSV_HEADERS];
  const headerMap = new Map<string, number>();

  for (const expected of expectedHeaders) {
    const idx = headerFields.indexOf(expected);
    if (idx !== -1) {
      headerMap.set(expected, idx);
    }
  }

  // Required headers
  const requiredHeaders = ["name", "base_price", "variant_sku"] as const;
  for (const req of requiredHeaders) {
    if (!headerMap.has(req)) {
      errors.push({ row: 1, column: req, message: `Missing required header: ${req}` });
    }
  }
  if (errors.length > 0) return { rows, errors };

  const col = (row: string[], header: string): string => {
    const idx = headerMap.get(header);
    return idx != null && idx < row.length ? unescapeCSV(row[idx]) : "";
  };

  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    const fields = parseCsvLine(lines[i]);
    const rowNum = i + 1;

    const name = col(fields, "name");
    if (!name) {
      errors.push({ row: rowNum, column: "name", message: "Product name is required" });
      continue;
    }

    const basePriceStr = col(fields, "base_price");
    const basePrice = parseInt(basePriceStr, 10);
    if (!basePriceStr || isNaN(basePrice) || basePrice < 0) {
      errors.push({
        row: rowNum,
        column: "base_price",
        message: "Base price must be a non-negative integer (cents)",
      });
      continue;
    }

    const status = (col(fields, "status") || "DRAFT").toUpperCase();
    if (!["DRAFT", "ACTIVE", "ARCHIVED"].includes(status)) {
      errors.push({
        row: rowNum,
        column: "status",
        message: `Invalid status: ${status}. Must be DRAFT, ACTIVE, or ARCHIVED`,
      });
      continue;
    }

    const variantSku = col(fields, "variant_sku");
    const stock = parseInt(col(fields, "variant_stock") || "0", 10);
    if (isNaN(stock) || stock < 0) {
      errors.push({
        row: rowNum,
        column: "variant_stock",
        message: "Stock must be a non-negative integer",
      });
      continue;
    }

    const priceAdj = parseInt(col(fields, "variant_price_adjustment") || "0", 10);
    if (isNaN(priceAdj)) {
      errors.push({
        row: rowNum,
        column: "variant_price_adjustment",
        message: "Price adjustment must be an integer",
      });
      continue;
    }

    const weightStr = col(fields, "variant_weight");
    let weight: number | null = null;
    if (weightStr) {
      weight = parseInt(weightStr, 10);
      if (isNaN(weight) || weight < 0) {
        errors.push({
          row: rowNum,
          column: "variant_weight",
          message: "Weight must be a non-negative integer (grams)",
        });
        continue;
      }
    }

    const featuredStr = col(fields, "featured").toLowerCase();
    const featured =
      featuredStr === "true" || featuredStr === "1" || featuredStr === "yes";

    rows.push({
      productId: col(fields, "product_id") || undefined,
      name,
      slug: col(fields, "slug") || undefined,
      description: col(fields, "description") || undefined,
      nameDE: col(fields, "name_de") || undefined,
      descriptionDE: col(fields, "description_de") || undefined,
      basePrice,
      status: status as "DRAFT" | "ACTIVE" | "ARCHIVED",
      featured,
      categorySlug: col(fields, "category_slug") || undefined,
      variantSku,
      variantSize: col(fields, "variant_size") || undefined,
      variantColor: col(fields, "variant_color") || undefined,
      variantMaterial: col(fields, "variant_material") || undefined,
      variantWeight: weight,
      variantStock: stock,
      variantPriceAdjustment: priceAdj,
      imageUrls: col(fields, "image_urls") || undefined,
    });
  }

  return { rows, errors };
}

// ==================== VALIDATE ====================

export function validateCsvRows(
  rows: ProductCsvRow[],
  existingSkus: Set<string>,
  existingCategories: Map<string, string>,
  mode: "CREATE_ONLY" | "UPDATE_ONLY" | "CREATE_AND_UPDATE",
): CsvValidationError[] {
  const errors: CsvValidationError[] = [];
  const seenSkus = new Set<string>();

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2; // +2 because header is row 1, data starts at row 2

    // SKU uniqueness within the import
    if (row.variantSku) {
      if (seenSkus.has(row.variantSku)) {
        errors.push({
          row: rowNum,
          column: "variant_sku",
          message: `Duplicate SKU in import: ${row.variantSku}`,
        });
      }
      seenSkus.add(row.variantSku);
    }

    // Mode-specific validation
    if (mode === "CREATE_ONLY" && row.productId) {
      // In create-only mode, if product_id exists in DB, it's a problem
      // We'll skip this — the action will handle it
    }

    if (
      mode === "UPDATE_ONLY" &&
      row.variantSku &&
      !existingSkus.has(row.variantSku) &&
      !row.productId
    ) {
      errors.push({
        row: rowNum,
        column: "variant_sku",
        message: `SKU not found for update: ${row.variantSku}`,
      });
    }

    // Category validation
    if (row.categorySlug && !existingCategories.has(row.categorySlug)) {
      errors.push({
        row: rowNum,
        column: "category_slug",
        message: `Category not found: ${row.categorySlug}`,
      });
    }

    // SKU required for variant rows
    if (!row.variantSku && !row.productId) {
      // A row without a SKU and without a product_id might be a product-only row (no variant)
      // This is acceptable
    }
  }

  return errors;
}

// ==================== TEMPLATE ====================

export function generateCsvTemplate(): string {
  const exampleRows = [
    [
      "",
      "Classic T-Shirt",
      "classic-t-shirt",
      "A comfortable cotton t-shirt",
      "Klassisches T-Shirt",
      "Ein bequemes Baumwoll-T-Shirt",
      "2990",
      "ACTIVE",
      "true",
      "clothing",
      "TSH-BLK-M",
      "M",
      "Black",
      "Cotton",
      "200",
      "50",
      "0",
      "",
    ],
    [
      "",
      "Classic T-Shirt",
      "classic-t-shirt",
      "A comfortable cotton t-shirt",
      "Klassisches T-Shirt",
      "Ein bequemes Baumwoll-T-Shirt",
      "2990",
      "ACTIVE",
      "true",
      "clothing",
      "TSH-BLK-L",
      "L",
      "Black",
      "Cotton",
      "220",
      "30",
      "0",
      "",
    ],
    [
      "",
      "Premium Mug",
      "premium-mug",
      "Ceramic mug with logo",
      "Premium Tasse",
      "Keramiktasse mit Logo",
      "1490",
      "DRAFT",
      "false",
      "",
      "MUG-WHT",
      "",
      "White",
      "Ceramic",
      "350",
      "100",
      "0",
      "",
    ],
  ];

  return [
    CSV_HEADERS.join(","),
    ...exampleRows.map((row) => row.map(escapeCSV).join(",")),
  ].join("\n");
}

// ==================== GROUP ROWS BY PRODUCT ====================

export type GroupedProduct = {
  productId?: string;
  name: string;
  slug?: string;
  description?: string;
  nameDE?: string;
  descriptionDE?: string;
  basePrice: number;
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
  featured: boolean;
  categorySlug?: string;
  imageUrls: string[];
  variants: {
    sku: string;
    size?: string;
    color?: string;
    material?: string;
    weight?: number | null;
    stock: number;
    priceAdjustment: number;
  }[];
};

/**
 * Groups CSV rows by product (rows with the same name+slug are considered the same product).
 */
export function groupRowsByProduct(rows: ProductCsvRow[]): GroupedProduct[] {
  const map = new Map<string, GroupedProduct>();

  for (const row of rows) {
    const key = row.productId || row.slug || row.name;
    let group = map.get(key);

    if (!group) {
      group = {
        productId: row.productId,
        name: row.name,
        slug: row.slug,
        description: row.description,
        nameDE: row.nameDE,
        descriptionDE: row.descriptionDE,
        basePrice: row.basePrice,
        status: row.status,
        featured: row.featured,
        categorySlug: row.categorySlug,
        imageUrls: row.imageUrls ? row.imageUrls.split("|").filter(Boolean) : [],
        variants: [],
      };
      map.set(key, group);
    }

    if (row.variantSku) {
      group.variants.push({
        sku: row.variantSku,
        size: row.variantSize,
        color: row.variantColor,
        material: row.variantMaterial,
        weight: row.variantWeight,
        stock: row.variantStock,
        priceAdjustment: row.variantPriceAdjustment,
      });
    }
  }

  return Array.from(map.values());
}
