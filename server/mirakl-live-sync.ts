import { isExportableAttributeField } from "../lib/demo-contract.ts"
import type { AttributeFieldId, CandidateRecord, ProductRecord } from "../lib/types.ts"

// Resolved at call time (not module load) so the env and the dev-tenant guard are testable and
// always reflect the current configuration. Defaults to the Mirakl dev tenant.
function miraklBaseUrl() {
  return process.env.MIRAKL_BASE_URL || "https://seidor-dev.mirakl.net"
}
const IDENTITY_FIELDS = new Set<AttributeFieldId>(["brand", "productName", "ean", "description"])
const DEFAULT_ATTRIBUTE_CODE_MAP: Partial<Record<AttributeFieldId, string>> = {
  storage: "storage_gb",
  usbC: "usb_c",
  weight: "weight_g",
  dimensions: "dimensions_mm",
  compatibility: "compatible",
  connectivity: "gaming_feature",
} satisfies Partial<Record<AttributeFieldId, string>>

export type MiraklAttributeSyncDraft = {
  productId: string
  miraklProductId: string
  headers: string[]
  rows: string[][]
  csv: string
  syncedFields: AttributeFieldId[]
}

export type MiraklAttributeSyncSubmission = {
  draft: MiraklAttributeSyncDraft
  importId: number | string
  importStatus?: unknown
}

function csvCell(value: string) {
  if (!/[;"\n\r]/.test(value)) return value
  return `"${value.replaceAll('"', '""')}"`
}

function toCsv(headers: string[], rows: string[][]) {
  return [headers, ...rows].map((row) => row.map(csvCell).join(";")).join("\n")
}

function getMiraklCategoryCode() {
  return process.env.MIRAKL_SYNC_CATEGORY_CODE ?? null
}

function getAttributeCode(field: AttributeFieldId) {
  const override = process.env[`MIRAKL_ATTR_${field}`]
  return override ?? DEFAULT_ATTRIBUTE_CODE_MAP[field] ?? field
}

function latestAcceptedAttributeCandidates(product: ProductRecord) {
  const byField = new Map<AttributeFieldId, CandidateRecord & { fieldName: AttributeFieldId }>()

  for (const candidate of product.candidates) {
    if (candidate.status !== "accepted") continue
    if (!isExportableAttributeField(candidate.fieldName)) continue
    if (IDENTITY_FIELDS.has(candidate.fieldName)) continue
    byField.set(candidate.fieldName, candidate as CandidateRecord & { fieldName: AttributeFieldId })
  }

  return [...byField.values()]
}

export function buildMiraklAttributeSyncDraft(product: ProductRecord): MiraklAttributeSyncDraft {
  const candidates = latestAcceptedAttributeCandidates(product)
  const syncedFields = candidates.map((candidate) => candidate.fieldName)
  const categoryCode = getMiraklCategoryCode()
  const headers = [categoryCode ? "category" : null, "shop_sku", ...candidates.map((candidate) => getAttributeCode(candidate.fieldName))].filter((header): header is string => header != null)
  const rows = [[categoryCode, product.miraklProductId, ...candidates.map((candidate) => candidate.candidateValue)].filter((value): value is string => value != null)]

  return {
    productId: product.id,
    miraklProductId: product.miraklProductId,
    headers,
    rows,
    csv: toCsv(headers, rows),
    syncedFields,
  }
}

// Hard guard (ADR 0005 / AGENTS.md): write-back is restricted to the Mirakl DEV tenant. Production
// must be unreachable from this flow regardless of env configuration — no override is honoured.
function assertDevTenant(baseUrl: string) {
  let host: string
  try {
    host = new URL(baseUrl).hostname.toLowerCase()
  } catch {
    throw new Error(`Invalid MIRAKL_BASE_URL: ${baseUrl}`)
  }
  const isDevTenant = /-dev\.mirakl\.net$/.test(host) || host === "localhost" || host === "127.0.0.1"
  if (!isDevTenant) {
    throw new Error(
      `Refusing to submit to Mirakl host "${host}". Write-back is restricted to the dev tenant (ADR 0005); production is unreachable from this flow and requires separate sign-off.`,
    )
  }
}

function requireMiraklOperatorToken() {
  const token = process.env.MIRAKL_OPERATOR_API_KEY
  if (!token) throw new Error("MIRAKL_OPERATOR_API_KEY is not configured in the server environment.")
  return token
}

function requireMiraklShopId() {
  const shopId = process.env.MIRAKL_SYNC_SHOP_ID ?? process.env.MIRAKL_SHOP_ID
  if (!shopId) throw new Error("MIRAKL_SYNC_SHOP_ID is not configured in the server environment.")
  return shopId
}

function requireMiraklCategoryCode() {
  if (!getMiraklCategoryCode()) throw new Error("MIRAKL_SYNC_CATEGORY_CODE is not configured in the server environment.")
}

async function readJsonResponse(response: Response) {
  const text = await response.text()
  if (!text) return {}
  try {
    return JSON.parse(text)
  } catch {
    return { raw: text }
  }
}

async function pollMiraklImportStatus(importId: number | string, token: string) {
  const attempts = Number(process.env.MIRAKL_SYNC_POLL_ATTEMPTS ?? 6)
  const delayMs = Number(process.env.MIRAKL_SYNC_POLL_DELAY_MS ?? 1000)
  const statusUrl = new URL(`/api/products/imports/${importId}`, miraklBaseUrl())
  let lastStatus: unknown

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    if (attempt > 0) await new Promise((resolve) => setTimeout(resolve, delayMs))

    const response = await fetch(statusUrl, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
    const body = await readJsonResponse(response)
    if (!response.ok) throw new Error(`Mirakl import status failed: ${response.status} ${response.statusText}`)
    if (typeof body === "object" && body && "transform_lines_in_error" in body && Number(body.transform_lines_in_error) > 0) {
      throw new Error(`Mirakl import ${importId} has transformation errors.`)
    }
    lastStatus = body
    if (typeof body === "object" && body && "import_status" in body && !/WAITING|RUNNING|PROCESSING|PENDING/i.test(String(body.import_status))) {
      return body
    }
  }

  throw new Error(`Mirakl import ${importId} did not finish before polling timeout. Last status: ${typeof lastStatus === "object" && lastStatus && "import_status" in lastStatus ? String(lastStatus.import_status) : "unknown"}`)
}

export async function submitMiraklAttributeSync(product: ProductRecord): Promise<MiraklAttributeSyncSubmission> {
  const draft = buildMiraklAttributeSyncDraft(product)
  if (draft.syncedFields.length === 0) throw new Error("No approved attribute candidates are ready to sync.")

  assertDevTenant(miraklBaseUrl())
  const token = requireMiraklOperatorToken()
  const shopId = requireMiraklShopId()
  requireMiraklCategoryCode()
  const url = new URL("/api/products/imports", miraklBaseUrl())
  const form = new FormData()
  form.append("operator_format", "true")
  form.append("shop", shopId)
  form.append("file", new Blob([draft.csv], { type: "text/csv" }), `${product.id}-attributes.csv`)

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: form,
  })
  const body = await readJsonResponse(response)

  if (!response.ok) throw new Error(`Mirakl product import failed: ${response.status} ${response.statusText}`)
  const importId = body.import_id
  if (importId == null) throw new Error("Mirakl product import did not return an import_id.")

  return {
    draft,
    importId,
    importStatus: await pollMiraklImportStatus(importId, token),
  }
}
