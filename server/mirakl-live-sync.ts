import { isExportableAttributeField } from "../lib/demo-contract.ts"
import type { AttributeFieldId, CandidateRecord, ProductRecord } from "../lib/types.ts"
import { getKnownAttributeCodes } from "./mirakl-catalog-config.ts"
import { isDevMiraklHost, miraklRequest, resolveMiraklHost } from "./mirakl-request.ts"

// Resolved at call time (not module load) so the env and the dev-tenant guard are testable and
// always reflect the current configuration. Defaults to the Mirakl dev tenant.
function miraklBaseUrl() {
  return process.env.MIRAKL_BASE_URL || "https://seidor-dev.mirakl.net"
}
const IDENTITY_FIELDS = new Set<AttributeFieldId>(["brand", "productName", "ean", "description"])

// Real Mirakl attribute codes, sourced from the committed category config
// (data/mirakl/catalog-config/* — the gaming-console category: ps5_attributes_import.csv etc.).
// ADR 0007: the previous map invented `connectivity→gaming_feature` and `compatibility→compatible`
// (codes that exist in NO committed config) and fell back to raw camelCase field names — both of
// which Mirakl silently no-ops. Only fields with a real, verifiable code are mapped here; any other
// accepted field is reported as `unmappedFields` and excluded rather than shipped under a fake code.
const DEFAULT_ATTRIBUTE_CODE_MAP: Partial<Record<AttributeFieldId, string>> = {
  storage: "storage_gb",
  ram: "ram_gb",
  weight: "weight_g",
  dimensions: "dimensions_mm",
  usbC: "usb_c",
  bluetooth: "bluetooth",
  cameraResolution: "rear_camera_mpx",
} satisfies Partial<Record<AttributeFieldId, string>>

export type MiraklAttributeSyncDraft = {
  productId: string
  miraklProductId: string
  headers: string[]
  rows: string[][]
  csv: string
  // Fields with a real Mirakl code that are actually in the draft.
  syncedFields: AttributeFieldId[]
  // Accepted, exportable fields with NO known Mirakl code — excluded from the draft and surfaced so
  // the operator isn't told a value synced when Mirakl would never have accepted it.
  unmappedFields: AttributeFieldId[]
}

export type MiraklAttributeSyncSubmission = {
  draft: MiraklAttributeSyncDraft
  importId: number | string
  importStatus?: unknown
  unmappedFields: AttributeFieldId[]
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

// Returns the real Mirakl code for a field, or null when none is known. An env override
// (MIRAKL_ATTR_<field>) lets an operator wire a code for the live run; there is deliberately NO
// camelCase fallback — emitting a field id as a code is the silent-no-op bug ADR 0007 fixes.
function getAttributeCode(field: AttributeFieldId): string | null {
  const override = process.env[`MIRAKL_ATTR_${field}`]
  return override ?? DEFAULT_ATTRIBUTE_CODE_MAP[field] ?? null
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
  const mapped: { field: AttributeFieldId; code: string; value: string }[] = []
  const unmappedFields: AttributeFieldId[] = []
  for (const candidate of candidates) {
    const code = getAttributeCode(candidate.fieldName)
    if (code) mapped.push({ field: candidate.fieldName, code, value: candidate.candidateValue })
    else unmappedFields.push(candidate.fieldName)
  }

  const categoryCode = getMiraklCategoryCode()
  const headers = [categoryCode ? "category" : null, "shop_sku", ...mapped.map((entry) => entry.code)].filter((header): header is string => header != null)
  const rows = [[categoryCode, product.miraklProductId, ...mapped.map((entry) => entry.value)].filter((value): value is string => value != null)]

  return {
    productId: product.id,
    miraklProductId: product.miraklProductId,
    headers,
    rows,
    csv: toCsv(headers, rows),
    syncedFields: mapped.map((entry) => entry.field),
    unmappedFields,
  }
}

// ---------------------------------------------------------------------------------------------
// Local CSV-shape dry-run (ADR 0007): build the draft and prove its attribute headers are a subset
// of the category's REAL committed codes — no live call, usable in tests and before any write.
// ---------------------------------------------------------------------------------------------
const STRUCTURAL_HEADERS = new Set(["category", "shop_sku"])

export type MiraklDryRunResult = {
  productId: string
  miraklProductId: string
  draft: MiraklAttributeSyncDraft
  knownCodeCategory: string | null
  attributeHeaders: string[]
  // Attribute codes in the draft that are NOT in the category's committed code set (would no-op).
  unknownHeaders: string[]
  // Accepted fields with no code mapping at all (excluded from the draft).
  unmappedFields: AttributeFieldId[]
  ok: boolean
}

export function dryRunMiraklAttributeSync(product: ProductRecord, options: { categoryCode?: string | null } = {}): MiraklDryRunResult {
  const draft = buildMiraklAttributeSyncDraft(product)
  // Default to the union of every committed category's codes so the check catches invented codes
  // regardless of the configured category label.
  const category = options.categoryCode ?? null
  const known = getKnownAttributeCodes(category)
  const attributeHeaders = draft.headers.filter((header) => !STRUCTURAL_HEADERS.has(header))
  const unknownHeaders = attributeHeaders.filter((header) => !known.has(header))

  return {
    productId: product.id,
    miraklProductId: product.miraklProductId,
    draft,
    knownCodeCategory: category,
    attributeHeaders,
    unknownHeaders,
    unmappedFields: draft.unmappedFields,
    ok: unknownHeaders.length === 0 && draft.unmappedFields.length === 0,
  }
}

// Hard guard (ADR 0005 / AGENTS.md): write-back is restricted to the Mirakl DEV tenant. Production
// must be unreachable from this flow regardless of env configuration — no override is honoured.
function assertDevTenant(baseUrl: string) {
  if (!isDevMiraklHost(baseUrl)) {
    const host = resolveMiraklHost(baseUrl)
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

// Best-effort fetch of an import's error / new-product report (the 2402 404s exposed this gap).
// Returns null on any failure — it only enriches the thrown error, never gates control flow.
async function fetchImportReport(importId: number | string, token: string, report: "error_report" | "new_product_report") {
  try {
    const url = new URL(`/api/products/imports/${importId}/${report}`, miraklBaseUrl())
    const response = await miraklRequest(url, token)
    if (!response.ok) return null
    const text = await response.text()
    return text || null
  } catch {
    return null
  }
}

// Mirakl reports counts as either `transform_lines_*` or `lines_*` depending on the phase; read both.
function importLineCounts(body: unknown) {
  const pick = (a: string, b: string) => {
    const source = (body ?? {}) as Record<string, unknown>
    const value = source[a] ?? source[b]
    return value == null ? NaN : Number(value)
  }
  return {
    read: pick("transform_lines_read", "lines_read"),
    success: pick("transform_lines_in_success", "lines_in_success"),
    error: pick("transform_lines_in_error", "lines_in_error"),
  }
}

async function pollMiraklImportStatus(importId: number | string, token: string) {
  const attempts = Number(process.env.MIRAKL_SYNC_POLL_ATTEMPTS ?? 6)
  const delayMs = Number(process.env.MIRAKL_SYNC_POLL_DELAY_MS ?? 1000)
  const statusUrl = new URL(`/api/products/imports/${importId}`, miraklBaseUrl())
  let lastStatus: unknown

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    if (attempt > 0) await new Promise((resolve) => setTimeout(resolve, delayMs))

    const response = await miraklRequest(statusUrl, token)
    const body = await readJsonResponse(response)
    if (!response.ok) throw new Error(`Mirakl import status failed: ${response.status} ${response.statusText}`)
    lastStatus = body

    const status = typeof body === "object" && body && "import_status" in body ? String(body.import_status) : ""
    // Still in progress — keep polling.
    if (!status || /WAITING|RUNNING|PROCESSING|PENDING|QUEUED/i.test(status)) continue

    // Terminal status reached. SENT alone is NOT success (ADR 0005/0007): validate the transform
    // counts so a wrong attribute code — Mirakl reads the row, transforms nothing, reports 0 errors
    // — is treated as the no-op failure it is, not a green import.
    const { read, success, error } = importLineCounts(body)
    if (Number.isFinite(error) && error > 0) {
      const report = await fetchImportReport(importId, token, "error_report")
      throw new Error(`Mirakl import ${importId} finished with ${error} transformation error(s); the value did not land.${report ? ` Report: ${report.slice(0, 500)}` : ""}`)
    }
    if (!(Number.isFinite(read) && read >= 1) || !(Number.isFinite(success) && success >= 1)) {
      const report = await fetchImportReport(importId, token, "error_report")
      throw new Error(
        `Mirakl import ${importId} is a no-op: ${Number.isFinite(read) ? read : 0} line(s) read, ${Number.isFinite(success) ? success : 0} transformed successfully. ` +
          `The attribute code(s) are likely wrong for this category — the value did NOT land (status ${status}).${report ? ` Report: ${report.slice(0, 500)}` : ""}`,
      )
    }
    return body // genuine success: read >= 1, success >= 1, error == 0
  }

  throw new Error(`Mirakl import ${importId} did not finish before polling timeout. Last status: ${typeof lastStatus === "object" && lastStatus && "import_status" in lastStatus ? String(lastStatus.import_status) : "unknown"}`)
}

export async function submitMiraklAttributeSync(product: ProductRecord): Promise<MiraklAttributeSyncSubmission> {
  const draft = buildMiraklAttributeSyncDraft(product)
  if (draft.syncedFields.length === 0) {
    const detail = draft.unmappedFields.length > 0 ? ` (${draft.unmappedFields.length} accepted field(s) have no known Mirakl code: ${draft.unmappedFields.join(", ")})` : ""
    throw new Error(`No approved attribute candidates with a known Mirakl code are ready to sync.${detail}`)
  }

  assertDevTenant(miraklBaseUrl())
  const token = requireMiraklOperatorToken()
  const shopId = requireMiraklShopId()
  requireMiraklCategoryCode()
  const url = new URL("/api/products/imports", miraklBaseUrl())
  const form = new FormData()
  form.append("operator_format", "true")
  form.append("shop", shopId)
  form.append("file", new Blob([draft.csv], { type: "text/csv" }), `${product.id}-attributes.csv`)

  const response = await miraklRequest(url, token, { method: "POST", body: form })
  const body = await readJsonResponse(response)

  if (!response.ok) throw new Error(`Mirakl product import failed: ${response.status} ${response.statusText}`)
  const importId = body.import_id
  if (importId == null) throw new Error("Mirakl product import did not return an import_id.")

  return {
    draft,
    importId,
    importStatus: await pollMiraklImportStatus(importId, token),
    unmappedFields: draft.unmappedFields,
  }
}
