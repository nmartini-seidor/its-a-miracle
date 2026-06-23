import { readdirSync, readFileSync } from "node:fs"
import path from "node:path"
import { isAttributeFieldId } from "../lib/demo-contract.ts"
import { schemas } from "../lib/fixtures.ts"
import { qualityScore } from "../lib/scoring.ts"
import type { AttributeFieldId, ProductRecord } from "../lib/types.ts"

// Map a real Mirakl snapshot (captured by scripts/sync-mirakl-snapshot.mjs) into ProductRecord
// baselines so the catalog is seeded from genuine Mirakl data rather than fixtures (ADR 0005).
// The operator CSV schema varies, so column matching is header-driven and tolerant: known columns
// map to fields, anything matching a canonical attribute-field id becomes a baseline attribute,
// and unknown columns are ignored.

export type MiraklSnapshot = {
  capturedAt?: string
  miraklBaseUrl?: string
  sourceStatusExports?: { providerId?: string | number; shopName?: string | null; status?: string; csv?: string }[]
}

const SNAPSHOT_DIR = path.join(process.cwd(), "data", "mirakl", "snapshots")

// Parse a semicolon-delimited Mirakl operator CSV (RFC-style quoting) into header-keyed rows.
export function parseSemicolonCsv(text: string): Record<string, string>[] {
  const rows: string[][] = []
  let field = ""
  let row: string[] = []
  let inQuotes = false
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i]
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i += 1 } else inQuotes = false
      } else field += ch
      continue
    }
    if (ch === '"') inQuotes = true
    else if (ch === ";") { row.push(field); field = "" }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i += 1
      row.push(field)
      if (row.some((cell) => cell.trim() !== "")) rows.push(row)
      row = []
      field = ""
    } else field += ch
  }
  if (field !== "" || row.length > 0) {
    row.push(field)
    if (row.some((cell) => cell.trim() !== "")) rows.push(row)
  }
  if (rows.length < 2) return []
  const headers = rows[0].map((header) => header.trim())
  return rows.slice(1).map((cells) => {
    const record: Record<string, string> = {}
    headers.forEach((header, index) => {
      record[header] = (cells[index] ?? "").trim()
    })
    return record
  })
}

function normalizeKey(key: string): string {
  return key.toLowerCase().replace(/\[[^\]]*\]/g, "").replace(/[^a-z0-9]/g, "")
}

function pick(row: Record<string, string>, candidates: string[]): string | null {
  const normalized = new Map(Object.entries(row).map(([key, value]) => [normalizeKey(key), value]))
  for (const candidate of candidates) {
    const value = normalized.get(normalizeKey(candidate))
    if (value && value.trim()) return value.trim()
  }
  return null
}

const SKU_KEYS = ["shop_sku", "sku", "product-sku", "product_sku", "product-id", "product_id", "productid"]
const TITLE_KEYS = ["product-name", "product_name", "title", "name", "label", "product-title"]
const CATEGORY_KEYS = ["category-label", "category_label", "category", "category-code", "category_code"]
const BRAND_KEYS = ["brand", "brand-name", "manufacturer"]
const EAN_KEYS = ["ean", "gtin", "barcode", "ean13", "upc"]
const DESCRIPTION_KEYS = ["description", "product-description", "description [en]", "long-description"]

const VALID_SCHEMA_IDS = new Set(schemas.map((schema) => schema.id))
const SCHEMA_KEYWORDS: { pattern: RegExp; schemaId: string }[] = [
  { pattern: /headphone|earbud|earphone|auricular|audio/i, schemaId: "schema-headphones-earbuds" },
  { pattern: /phone|smartphone|m[oó]vil/i, schemaId: "schema-smartphones" },
  { pattern: /tv|television|televisor/i, schemaId: "schema-televisions" },
  { pattern: /tablet/i, schemaId: "schema-tablets" },
  { pattern: /laptop|notebook|port[aá]til/i, schemaId: "schema-laptops" },
  { pattern: /video\s?game|videojuego|game\b/i, schemaId: "schema-video-games" },
  { pattern: /gaming|console|consola/i, schemaId: "schema-gaming-devices" },
]

function inferSchemaId(categoryPath: string[], title: string): string {
  const haystack = `${categoryPath.join(" ")} ${title}`
  for (const { pattern, schemaId } of SCHEMA_KEYWORDS) {
    if (pattern.test(haystack) && VALID_SCHEMA_IDS.has(schemaId)) return schemaId
  }
  return schemas[0]?.id ?? "schema-smartphones"
}

function getSchema(schemaId: string) {
  return schemas.find((schema) => schema.id === schemaId) ?? null
}

export function mapSnapshotRowToProduct(row: Record<string, string>): ProductRecord | null {
  const sku = pick(row, SKU_KEYS)
  if (!sku) return null
  const title = pick(row, TITLE_KEYS) ?? sku
  const brand = pick(row, BRAND_KEYS)
  const categoryRaw = pick(row, CATEGORY_KEYS)
  const categoryPath = categoryRaw ? categoryRaw.split(/[/>|]/).map((part) => part.trim()).filter(Boolean) : ["Uncategorized"]
  const schemaId = inferSchemaId(categoryPath, title)
  const description = pick(row, DESCRIPTION_KEYS) ?? ""
  const ean = pick(row, EAN_KEYS)

  const baselineAttributes: ProductRecord["baselineAttributes"] = { productName: title }
  if (brand) baselineAttributes.brand = brand
  if (ean) baselineAttributes.ean = ean
  if (description) baselineAttributes.description = description
  // Any column whose header normalizes to a canonical attribute field id becomes a baseline value.
  for (const [key, value] of Object.entries(row)) {
    if (!value || !value.trim()) continue
    const normalized = normalizeKey(key)
    const match = isAttributeFieldId(normalized) ? normalized : undefined
    if (match) baselineAttributes[match as AttributeFieldId] = value.trim()
  }

  const product: ProductRecord = {
    id: `mirakl-${sku.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    miraklProductId: sku,
    title,
    brand: brand ?? null,
    categoryPath,
    schemaId,
    listingStatus: "NEEDS_ENRICHMENT",
    qualityScore: 0,
    scoreBand: "red",
    baselineDescription: description,
    warnings: [],
    baselineAttributes,
    bestEvidenceByField: {},
    evidence: [],
    candidates: [],
  }
  const scored = qualityScore(product, getSchema(schemaId))
  product.qualityScore = scored.score
  product.scoreBand = scored.band
  product.listingStatus = scored.score >= 90 ? "READY_FOR_REVIEW" : "NEEDS_ENRICHMENT"
  return product
}

export function loadSnapshotProducts(snapshot: MiraklSnapshot): ProductRecord[] {
  const products: ProductRecord[] = []
  const seen = new Set<string>()
  for (const exportEntry of snapshot.sourceStatusExports ?? []) {
    for (const row of parseSemicolonCsv(exportEntry.csv ?? "")) {
      const product = mapSnapshotRowToProduct(row)
      if (product && !seen.has(product.id)) {
        seen.add(product.id)
        products.push(product)
      }
    }
  }
  return products
}

export function readSnapshotFile(filePath: string): MiraklSnapshot {
  return JSON.parse(readFileSync(filePath, "utf8")) as MiraklSnapshot
}

// Newest snapshot JSON in data/mirakl/snapshots, or null if none has been captured yet.
export function readLatestSnapshot(dir = SNAPSHOT_DIR): { snapshot: MiraklSnapshot; filePath: string } | null {
  let files: string[]
  try {
    files = readdirSync(dir).filter((file) => file.endsWith(".json"))
  } catch {
    return null
  }
  if (files.length === 0) return null
  files.sort()
  const filePath = path.join(dir, files[files.length - 1])
  return { snapshot: readSnapshotFile(filePath), filePath }
}
