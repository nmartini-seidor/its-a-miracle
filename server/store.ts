import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs"
import path from "node:path"
import { aggregators, demoSettings, products as seededProducts, schemas } from "../lib/fixtures.ts"
import { getFieldLabel, isExportableAttributeField } from "../lib/demo-contract.ts"
import { getMockResearchAgentDurationMs } from "../lib/mock-timing.ts"
import { qualityScore } from "../lib/scoring.ts"
import type {
  AttributeFieldId,
  CandidateRecord,
  ContractFieldId,
  AggregatorDefinition,
  EvidenceRecord,
  ExportPreview,
  SettingsSnapshot,
  ProductRecord,
  ResearchJob,
  ResearchJobStatus,
  ReviewDecision,
  SchemaDefinition,
} from "../lib/types.ts"

type ReviewDecisionRecord = {
  id: string
  candidateId: string
  decision: ReviewDecision
  reason?: string
  createdAt: string
}

type StoredResearchJob = ResearchJob & {
  applied: boolean
}

type DemoCatalogState = {
  products: ProductRecord[]
  researchRuns: StoredResearchJob[]
  reviewDecisions: ReviewDecisionRecord[]
  settings: SettingsSnapshot
  schemaOverrides: Record<string, SchemaDefinition>
  aggregatorOverrides: Record<string, AggregatorDefinition>
}

const stateFilePath = path.join(process.cwd(), "data", "demo-state.json")

function now() {
  return new Date().toISOString()
}

function toMillis(value: string) {
  return new Date(value).getTime()
}

function cloneDefaultSettings() {
  return structuredClone(demoSettings)
}

function sanitizeSettings(settings: Partial<SettingsSnapshot> = {}): SettingsSnapshot {
  const allowedAggregatorIds = new Set(aggregators.map((aggregator) => aggregator.id))
  const enabledAggregatorIds = settings.enabledAggregatorIds?.filter((id) => allowedAggregatorIds.has(id))

  return {
    ...cloneDefaultSettings(),
    ...settings,
    environment: "demo",
    miraklBaseUrl: settings.miraklBaseUrl?.trim() || demoSettings.miraklBaseUrl,
    fakeResearchMode: typeof settings.fakeResearchMode === "boolean" ? settings.fakeResearchMode : demoSettings.fakeResearchMode,
    defaultResearchDelaySeconds: clampNumber(settings.defaultResearchDelaySeconds, 5, 300, demoSettings.defaultResearchDelaySeconds),
    maxEvidencePerProduct: clampNumber(settings.maxEvidencePerProduct, 1, 10, demoSettings.maxEvidencePerProduct),
    defaultCandidateConfidence: settings.defaultCandidateConfidence ?? demoSettings.defaultCandidateConfidence,
    autoAssignSchemaByCategory:
      typeof settings.autoAssignSchemaByCategory === "boolean" ? settings.autoAssignSchemaByCategory : demoSettings.autoAssignSchemaByCategory,
    enabledAggregatorIds: enabledAggregatorIds ?? cloneDefaultSettings().enabledAggregatorIds,
  }
}

function clampNumber(value: number | undefined, min: number, max: number, fallback: number) {
  if (typeof value !== "number" || Number.isNaN(value)) return fallback
  return Math.min(max, Math.max(min, Math.round(value)))
}

function cloneImportedProducts() {
  return structuredClone(seededProducts).map((product) => ({
    ...product,
    bestEvidenceByField: {},
    candidates: [],
    evidence: [],
  }))
}

function buildInitialState(
  settings: SettingsSnapshot = cloneDefaultSettings(),
  schemaOverrides: Record<string, SchemaDefinition> = {},
  aggregatorOverrides: Record<string, AggregatorDefinition> = {},
): DemoCatalogState {
  return {
    products: cloneImportedProducts(),
    researchRuns: [],
    reviewDecisions: [],
    settings,
    schemaOverrides,
    aggregatorOverrides,
  }
}

function buildEmptyState(
  settings: SettingsSnapshot = cloneDefaultSettings(),
  schemaOverrides: Record<string, SchemaDefinition> = {},
  aggregatorOverrides: Record<string, AggregatorDefinition> = {},
): DemoCatalogState {
  return {
    products: [],
    researchRuns: [],
    reviewDecisions: [],
    settings,
    schemaOverrides,
    aggregatorOverrides,
  }
}

function ensureStateFile() {
  mkdirSync(path.dirname(stateFilePath), { recursive: true })
  try {
    readFileSync(stateFilePath, "utf8")
  } catch {
    writeFileSync(stateFilePath, JSON.stringify(buildInitialState(), null, 2))
  }
}

function readState(): DemoCatalogState {
  ensureStateFile()
  const state = JSON.parse(readFileSync(stateFilePath, "utf8")) as Partial<DemoCatalogState>
  return {
    products: state.products ?? [],
    researchRuns: state.researchRuns ?? [],
    reviewDecisions: state.reviewDecisions ?? [],
    settings: sanitizeSettings(state.settings),
    schemaOverrides: state.schemaOverrides ?? {},
    aggregatorOverrides: state.aggregatorOverrides ?? {},
  }
}

function writeState(state: DemoCatalogState) {
  const tempFilePath = `${stateFilePath}.tmp`
  writeFileSync(tempFilePath, JSON.stringify(state, null, 2))
  renameSync(tempFilePath, stateFilePath)
}

export function resetDemoState() {
  const state = readState()
  writeState(buildEmptyState(state.settings, state.schemaOverrides, state.aggregatorOverrides))
}

export function importDemoProducts() {
  const currentState = readState()
  const state = buildInitialState(currentState.settings, currentState.schemaOverrides, currentState.aggregatorOverrides)
  writeState(state)
  return state.products.length
}

export function getStoredSettings() {
  return readState().settings
}

export function updateStoredSettings(nextSettings: Partial<SettingsSnapshot>) {
  const state = readState()
  state.settings = sanitizeSettings({ ...state.settings, ...nextSettings })
  writeState(state)
  return state.settings
}

export function listStoredSchemas(baseSchemas: SchemaDefinition[]) {
  const overrides = readState().schemaOverrides
  return baseSchemas.map((schema) => overrides[schema.slug] ?? schema)
}

export function updateStoredSchema(baseSchemas: SchemaDefinition[], slug: string, nextSchema: SchemaDefinition) {
  const existingSchema = baseSchemas.find((schema) => schema.slug === slug)
  if (!existingSchema) return null

  const state = readState()
  const updatedSchema = {
    ...existingSchema,
    ...nextSchema,
    id: existingSchema.id,
    slug: existingSchema.slug,
  }
  state.schemaOverrides[existingSchema.slug] = updatedSchema
  writeState(state)
  return updatedSchema
}

export function listStoredAggregators(baseAggregators: AggregatorDefinition[]) {
  const overrides = readState().aggregatorOverrides
  return baseAggregators.map((aggregator) => overrides[aggregator.id] ?? aggregator)
}

export function updateStoredAggregator(baseAggregators: AggregatorDefinition[], id: string, nextAggregator: AggregatorDefinition) {
  const existingAggregator = baseAggregators.find((aggregator) => aggregator.id === id)
  if (!existingAggregator) return null

  const state = readState()
  const updatedAggregator = {
    ...existingAggregator,
    ...nextAggregator,
    id: existingAggregator.id,
  }
  state.aggregatorOverrides[existingAggregator.id] = updatedAggregator
  state.settings.enabledAggregatorIds = updatedAggregator.enabled
    ? [...new Set([...state.settings.enabledAggregatorIds, updatedAggregator.id])]
    : state.settings.enabledAggregatorIds.filter((aggregatorId) => aggregatorId !== updatedAggregator.id)
  writeState(state)
  return updatedAggregator
}


function hasBaselineValue(value: string | null | undefined) {
  return typeof value === "string" && value.trim().length > 0
}

function getInitialStatus(score: number, warnings: readonly string[]) {
  return score >= 90 && warnings.length === 0 ? "READY_FOR_REVIEW" : "NEEDS_ENRICHMENT"
}

function schemaMissingWarnings(product: ProductRecord, schema: SchemaDefinition) {
  return schema.requiredAttributes
    .filter((field) => !hasBaselineValue(product.baselineAttributes[field]))
    .map((field) => `${field} missing for ${schema.name}`)
}

function recomputeProductForSchema(product: ProductRecord, schema: SchemaDefinition, preserveExportReady = true) {
  product.warnings = [
    ...product.warnings.filter((warning) => !/ missing for /.test(warning)),
    ...schemaMissingWarnings(product, schema),
  ]
  const scored = qualityScore(product, schema)
  product.qualityScore = scored.score
  product.scoreBand = scored.band
  if (product.listingStatus !== "RESEARCH_IN_PROGRESS" && (!preserveExportReady || product.listingStatus !== "EXPORT_READY")) {
    product.listingStatus = getInitialStatus(scored.score, product.warnings)
  }
  return product
}

function getStateProductSchema(state: DemoCatalogState, product: ProductRecord) {
  const schema = schemas.find((item) => item.id === product.schemaId)
  return schema ? state.schemaOverrides[schema.slug] ?? schema : null
}

export function listStoredProducts() {
  return readState().products
}

export function getStoredProduct(productId: string) {
  return readState().products.find((item) => item.id === productId) ?? null
}

export function updateStoredProductSchema(baseSchemas: SchemaDefinition[], productId: string, schemaId: string) {
  const state = readState()
  const product = state.products.find((item) => item.id === productId)
  const schema = baseSchemas.map((item) => state.schemaOverrides[item.slug] ?? item).find((item) => item.id === schemaId)
  if (!product || !schema) return null

  product.schemaId = schema.id
  recomputeProductForSchema(product, schema)
  writeState(state)
  return product
}

function getLatestAcceptedCandidates(candidates: CandidateRecord[]) {
  const byField = new Map<ContractFieldId, CandidateRecord>()

  for (const candidate of candidates) {
    if (candidate.status !== "accepted") continue
    byField.set(candidate.fieldName, candidate)
  }

  return [...byField.values()]
}

function recomputeProductForAcceptedCandidates(product: ProductRecord, schema: SchemaDefinition) {
  const acceptedCandidates = getLatestAcceptedCandidates(product.candidates)
    .filter((candidate): candidate is CandidateRecord & { fieldName: AttributeFieldId } =>
      isExportableAttributeField(candidate.fieldName)
    )
  const projectedFields = new Set(acceptedCandidates.map((candidate) => candidate.fieldName))
  const projectedProduct: Pick<ProductRecord, "brand" | "baselineDescription" | "baselineAttributes" | "warnings" | "evidence"> = {
    brand: product.brand,
    baselineDescription: product.baselineDescription,
    baselineAttributes: { ...product.baselineAttributes },
    warnings: product.warnings.filter((warning) =>
      !warning.startsWith("Research completed;") && ![...projectedFields].some((field) => warningMatchesSyncedField(warning, field))
    ),
    evidence: product.evidence,
  }

  for (const candidate of acceptedCandidates) {
    projectedProduct.baselineAttributes[candidate.fieldName] = candidate.candidateValue
    if (candidate.fieldName === "description") projectedProduct.baselineDescription = candidate.candidateValue
    if (candidate.fieldName === "brand") projectedProduct.brand = candidate.candidateValue
  }

  const scored = qualityScore(projectedProduct, schema)
  product.qualityScore = scored.score
  product.scoreBand = scored.band
  return product
}

export function buildExportPreview(product: ProductRecord): ExportPreview {
  const rows = getLatestAcceptedCandidates(product.candidates).reduce<ExportPreview["rows"]>((acc, candidate) => {
    if (!isExportableAttributeField(candidate.fieldName)) return acc
    acc.push({
      field: candidate.fieldName,
      value: candidate.candidateValue,
      evidenceIds: candidate.sourceEvidenceIds,
    })
    return acc
  }, [])

  return {
    productId: product.id,
    miraklProductId: product.miraklProductId,
    status: "READY",
    rows,
    message: "Accepted values prepared for export.",
  }
}

export function applyReviewDecisionToProduct(product: ProductRecord, candidateId: string, decision: ReviewDecision, reason?: string) {
  const candidate = product.candidates.find((item) => item.id === candidateId)
  if (!candidate) return null

  if (decision === "APPROVE") {
    for (const sibling of product.candidates) {
      if (sibling.id !== candidateId && sibling.fieldName === candidate.fieldName && sibling.status === "accepted") {
        sibling.status = "rejected"
        sibling.reason = "Superseded by a newer accepted candidate."
      }
    }
  }

  candidate.status = decision === "APPROVE" ? "accepted" : decision === "REJECT" ? "rejected" : "needs_evidence"
  if (reason) candidate.reason = reason

  product.listingStatus = product.candidates.some((item) => item.status === "accepted")
    ? "EXPORT_READY"
    : "READY_FOR_REVIEW"

  return candidate
}

const researchSourceTemplates = [
  {
    aggregatorId: "mediamarkt-retail",
    sourceName: "MediaMarkt product page",
    sourceType: "retailer",
    confidence: "medium",
  },
  {
    aggregatorId: "official-manufacturer",
    sourceName: "Official manufacturer",
    sourceType: "manufacturer",
    confidence: "high",
  },
  {
    aggregatorId: "spec-database",
    sourceName: "Independent specification lookup",
    sourceType: "spec_database",
    confidence: "high",
  },
] as const satisfies readonly {
  aggregatorId: string
  sourceName: string
  sourceType: EvidenceRecord["sourceType"]
  confidence: EvidenceRecord["confidence"]
}[]

const explicitResearchProfiles: Record<string, Partial<Record<AttributeFieldId, string>>> = {
  "freeclip-2": {
    brand: "Huawei",
    ean: "6942103169434",
    connectivity: "Bluetooth 6.0 / dual-device connection",
    bluetoothVersion: "Bluetooth 6.0",
    weight: "37.8 g with charging case",
    batteryLife: "9 h earbuds / 38 h with charging case",
    usbC: "USB-C charging case",
    dimensions: "26.7 x 25.4 x 18.8 mm",
    compatibility: "Android / iOS",
    microphone: "Dual-microphone call pickup with wind-noise reduction",
    noiseReduction: "Call noise reduction",
    description: "Auriculares true wireless de diseño open-ear con sujeción cómoda, conexión multipunto y hasta 38 horas de autonomía con el estuche de carga.",
  },
  "galaxy-a55": {
    connectivity: "5G / Wi-Fi / Bluetooth / USB-C",
    cameraResolution: "50 MP main / 12 MP ultra-wide / 5 MP macro",
    batteryCapacity: "5000 mAh",
  },
  "lg-oled-c4-55": {
    refreshRate: "144 Hz",
    hdmiPorts: "4 x HDMI 2.1",
  },
  "sony-wh1000xm5": {
    bluetoothVersion: "Bluetooth 5.2",
    microphone: "Four beamforming microphones",
    noiseReduction: "Active noise cancelling",
    compatibility: "Android / iOS / Windows / macOS",
  },
  "redmi-pad-pro": {
    ram: "8 GB",
    resolution: "2560 x 1600",
    refreshRate: "120 Hz",
    batteryCapacity: "10000 mAh",
    connectivity: "Wi-Fi / Bluetooth / USB-C",
    bluetoothVersion: "Bluetooth 5.2",
    usbC: "USB-C",
    weight: "571 g",
    dimensions: "280.0 x 181.85 x 7.52 mm",
    stylusSupport: "Xiaomi Focus Pen compatible",
    cameraResolution: "8 MP rear / 8 MP front",
  },
}

function hasAttributeValue(value: string | null | undefined): value is string {
  return typeof value === "string" && value.trim().length > 0
}

function searchQuery(value: string) {
  return encodeURIComponent(value.replace(/\s+/g, " ").trim())
}

function normalizedBrand(product: ProductRecord) {
  return (product.brand ?? product.baselineAttributes.brand ?? product.title.split(" ")[0] ?? "").toLowerCase()
}

function manufacturerSearchUrl(product: ProductRecord) {
  const query = searchQuery(product.title)
  const brand = normalizedBrand(product)

  if (brand.includes("apple")) return `https://www.apple.com/search/${query}?src=globalnav`
  if (brand.includes("samsung")) return `https://www.samsung.com/es/search/?searchvalue=${query}`
  if (brand.includes("huawei")) return `https://consumer.huawei.com/es/search/?keyword=${query}`
  if (brand.includes("sony")) return `https://www.sony.es/search?searchString=${query}`
  if (brand.includes("lg")) return `https://www.lg.com/es/search/?search=${query}`
  if (brand.includes("lenovo")) return `https://www.lenovo.com/es/es/search?fq=&text=${query}`
  if (brand.includes("hp")) return `https://www.hp.com/es-es/search.html?keyword=${query}`
  if (brand.includes("msi")) return `https://es.msi.com/search/${query}`
  if (brand.includes("nintendo")) return `https://www.nintendo.com/es-es/Buscar/Buscar-299117.html?q=${query}`
  if (brand.includes("microsoft") || brand.includes("xbox")) return `https://www.xbox.com/es-ES/search?q=${query}`
  if (brand.includes("xiaomi") || brand.includes("redmi")) return `https://www.mi.com/es/search?keyword=${query}`
  return `https://www.google.com/search?q=${query}`
}

function specificationLookupUrl(product: ProductRecord) {
  const query = searchQuery(product.title)
  const category = product.categoryPath.join(" /").toLowerCase()
  if (/phone|smartphone|tablet|m[oó]vil/.test(category)) return `https://www.gsmarena.com/results.php3?sQuickSearch=yes&sName=${query}`
  if (/monitor|television|tv/.test(category)) return `https://www.rtings.com/search?q=${query}`
  if (/laptop|port[aá]til/.test(category)) return `https://www.notebookcheck.net/index.php?search=${query}`
  if (/audio|headphones|auriculares/.test(category)) return `https://www.rtings.com/search?q=${query}`
  return `https://www.google.com/search?q=${query}%20specifications`
}

function evidenceUrlForSource(product: ProductRecord, source: typeof researchSourceTemplates[number]) {
  if (source.aggregatorId === "mediamarkt-retail" && product.sourceUrl) return product.sourceUrl
  if (source.aggregatorId === "official-manufacturer") return manufacturerSearchUrl(product)
  return specificationLookupUrl(product)
}

function evidenceSummaryForSource(product: ProductRecord, source: typeof researchSourceTemplates[number]) {
  if (source.aggregatorId === "mediamarkt-retail") {
    return `Retailer-visible data collected for ${product.title}; used only when it supplies a field-level candidate.`
  }
  if (source.aggregatorId === "official-manufacturer") {
    return `Manufacturer specification data collected for ${product.title}.`
  }
  return `Independent specification data collected for ${product.title}.`
}

function getProductSchema(product: ProductRecord) {
  return schemas.find((schema) => schema.id === product.schemaId) ?? null
}

function sourceForField(product: ProductRecord, field: AttributeFieldId) {
  if (explicitResearchProfiles[product.id]?.[field]) return "official-manufacturer"
  if (getDerivedResearchAttributes(product)[field]) return field === "compatibility" ? "official-manufacturer" : "spec-database"
  if (hasAttributeValue(product.baselineAttributes[field])) return "mediamarkt-retail"
  return "spec-database"
}

function normalizeResearchValue(field: AttributeFieldId, value: string) {
  let normalized = value.trim()

  if (field === "storage" || field === "ram") {
    normalized = normalized.replace(/\b(\d+)\s*GB\b/gi, "$1 GB").replace(/\b(\d+)\s*TB\b/gi, "$1 TB")
  }

  if (field === "weight") {
    normalized = normalized.replace(/\b(\d+(?:[.,]\d+)?)\s*gr\b/gi, "$1 g").replace(",", ".")
  }

  if (field === "dimensions") {
    normalized = normalized
      .replace(/\s*(mmmm|mm)\b/gi, " mm")
      .replace(/\s*x\s*/gi, " x ")
      .replace(/\s+/g, " ")
      .replace(/\bmm mm\b/gi, "mm")
  }

  if (field === "displaySize") {
    normalized = normalized.replace(/\b(\d+(?:[.,]\d+)?)\s*p\b/gi, "$1 in").replace(",", ".")
  }

  if (field === "connectivity") {
    normalized = normalized.replace(/\bWifi\b/gi, "Wi-Fi")
  }

  if (field === "bluetooth" && /^yes$/i.test(normalized)) return "Bluetooth"
  if (field === "usbC" && /^yes$/i.test(normalized)) return "USB-C"

  return normalized
}

function canonicalCandidateValue(field: AttributeFieldId, value: string) {
  return normalizeResearchValue(field, value)
    .toLowerCase()
    .replace(/\bwi[\s-]?fi\b/g, "wifi")
    .replace(/\s+/g, "")
    .replace(/[^\p{Letter}\p{Number}.]/gu, "")
}

function isMeaningfulCandidateValue(field: AttributeFieldId, currentValue: string | null | undefined, candidateValue: string, sourceId: string) {
  if (!hasAttributeValue(currentValue)) return true
  if (sourceId === "mediamarkt-retail") return false
  return canonicalCandidateValue(field, currentValue) !== canonicalCandidateValue(field, candidateValue)
}

function productResearchText(product: ProductRecord) {
  return [product.title, product.baselineDescription, ...Object.values(product.baselineAttributes)].filter(hasAttributeValue).join(" ")
}

function getDerivedResearchAttributes(product: ProductRecord): Partial<Record<AttributeFieldId, string>> {
  const category = product.categoryPath.join(" / ").toLowerCase()
  const title = product.title.toLowerCase()
  const text = productResearchText(product)

  if (product.schemaId === "schema-gaming-devices") {
    if (title.includes("switch 2") || title.includes("switch2")) {
      return {
        storage: "256 GB",
        connectivity: "Wi-Fi 6 / Bluetooth / HDMI / USB-C",
        usbC: "USB-C",
        weight: "534 g",
        dimensions: "272 x 116 x 13.9 mm",
        compatibility: "Nintendo Switch 2",
      }
    }

    return {
      storage: title.includes("oled") ? "64 GB" : "32 GB",
      connectivity: "Wi-Fi / Bluetooth / HDMI / USB-C",
      usbC: "USB-C",
      weight: title.includes("oled") ? "420 g" : "398 g",
      dimensions: "242 x 102 x 13.9 mm",
      compatibility: "Nintendo Switch",
    }
  }

  if (product.schemaId === "schema-video-games" && /switch/i.test(product.title)) {
    return {
      compatibility: title.includes("switch 2") || title.includes("switch2") ? "Nintendo Switch 2" : "Nintendo Switch",
    }
  }

  if (/tablet|phone|smartphone|laptop|computing/.test(category)) {
    const ramMatch = text.match(/\b(\d+)\s*GB\s+(?:de\s+)?(?:memoria\s+)?RAM\b/i) ?? text.match(/\bRAM\s*(\d+)\s*GB\b/i)
    const storageMatch = text.match(/\b(\d+)\s*(GB|TB)\b/i)
    const displayMatch = text.match(/\b(\d+(?:[.,]\d+)?)\s*(?:\"|pulgadas|inch|in)\b/i)

    return {
      ...(!hasAttributeValue(product.baselineAttributes.connectivity) ? { connectivity: "Wi-Fi / Bluetooth / USB-C" } : {}),
      ...(!hasAttributeValue(product.baselineAttributes.usbC) ? { usbC: "USB-C" } : {}),
      ...(!hasAttributeValue(product.baselineAttributes.ram) && ramMatch?.[1] ? { ram: `${ramMatch[1]} GB` } : {}),
      ...(!hasAttributeValue(product.baselineAttributes.storage) && storageMatch?.[1] ? { storage: `${storageMatch[1]} ${storageMatch[2].toUpperCase()}` } : {}),
      ...(!hasAttributeValue(product.baselineAttributes.displaySize) && displayMatch?.[1] ? { displaySize: `${displayMatch[1].replace(",", ".")} in` } : {}),
    }
  }

  return {}
}

function getResearchEvidence(product: ProductRecord, field: AttributeFieldId) {
  const profileValue = explicitResearchProfiles[product.id]?.[field]
  if (hasAttributeValue(profileValue)) {
    return {
      value: profileValue,
      sourceId: "official-manufacturer",
    }
  }

  const derivedValue = getDerivedResearchAttributes(product)[field]
  if (hasAttributeValue(derivedValue)) {
    return {
      value: derivedValue,
      sourceId: field === "compatibility" ? "official-manufacturer" : "spec-database",
    }
  }

  if (field === "description") return null

  const baselineValue = product.baselineAttributes[field]
  if (hasAttributeValue(baselineValue)) {
    return {
      value: baselineValue,
      sourceId: "mediamarkt-retail",
    }
  }

  return null
}

function getEvidenceValue(product: ProductRecord, field: AttributeFieldId, source: typeof researchSourceTemplates[number]) {
  const evidence = getResearchEvidence(product, field)
  if (evidence?.sourceId !== source.aggregatorId) return null
  return evidence.value
}

function getCandidateValue(product: ProductRecord, field: AttributeFieldId, evidenceValue: string) {
  return normalizeResearchValue(field, evidenceValue)
}

function candidateReasonForValue(field: AttributeFieldId, evidenceValue: string, candidateValue: string) {
  if (candidateValue !== evidenceValue) return `Candidate normalizes the researched ${field} value for Mirakl review.`
  return "Candidate derived from researched field evidence."
}

function getResearchFields(product: ProductRecord) {
  const schema = getProductSchema(product)
  const reviewFields = [...(schema?.requiredAttributes ?? []), ...(schema?.recommendedAttributes ?? [])]
  const researchFields = Object.keys({
    ...explicitResearchProfiles[product.id],
    ...getDerivedResearchAttributes(product),
  }).filter((field): field is AttributeFieldId => isExportableAttributeField(field as ContractFieldId))
  return [...new Set([...reviewFields, ...researchFields])].filter((field) => {
    const evidence = getResearchEvidence(product, field)
    if (!evidence) return false
    const candidateValue = getCandidateValue(product, field, evidence.value)
    return hasAttributeValue(candidateValue)
  })
}

function buildResearchOutcome(product: ProductRecord, sequence: number, timestamp: string) {
  const researchFields = getResearchFields(product)
  const sourceIdByField = new Map(researchFields.map((field) => [field, sourceForField(product, field)] as const))
  const candidateFields = researchFields.filter((field) => {
    const evidence = getResearchEvidence(product, field)
    if (!evidence) return false
    const candidateValue = getCandidateValue(product, field, evidence.value)
    return hasAttributeValue(candidateValue) && isMeaningfulCandidateValue(field, product.baselineAttributes[field], candidateValue, sourceIdByField.get(field) ?? evidence.sourceId)
  })
  const evidenceValuesByField = new Map(researchFields.map((field) => {
    const source = researchSourceTemplates.find((item) => item.aggregatorId === sourceIdByField.get(field)) ?? researchSourceTemplates[0]
    return [field, getEvidenceValue(product, field, source)] as const
  }))
  const candidateValuesByField = new Map(researchFields.map((field) => {
    const evidenceValue = evidenceValuesByField.get(field)
    if (!hasAttributeValue(evidenceValue)) return [field, null] as const
    return [field, getCandidateValue(product, field, evidenceValue)] as const
  }))

  const evidence = researchSourceTemplates.map((source, index): EvidenceRecord => {
    const evidenceFields = researchFields.filter((field) => sourceIdByField.get(field) === source.aggregatorId)
    const extractedFields = evidenceFields.reduce<EvidenceRecord["extractedFields"]>((acc, field) => {
      const value = getEvidenceValue(product, field, source)
      if (value != null) acc[field] = value
      return acc
    }, {})

    return {
      id: `ev-research-${product.id}-${sequence}-${index + 1}`,
      productId: product.id,
      aggregatorId: source.aggregatorId,
      sourceName: source.sourceName,
      sourceType: source.sourceType,
      sourceUrl: evidenceUrlForSource(product, source),
      title: `${source.sourceName}: ${product.title}`,
      summary: evidenceSummaryForSource(product, source),
      extractedFields,
      capturedAt: timestamp,
      confidence: source.confidence,
    }
  }).filter((record) => Object.keys(record.extractedFields).length > 0)

  const candidates = candidateFields.flatMap((field): CandidateRecord[] => {
    const evidenceValue = evidenceValuesByField.get(field)
    const candidateValue = candidateValuesByField.get(field)
    if (!hasAttributeValue(evidenceValue) || !hasAttributeValue(candidateValue)) return []

    return [{
      id: `cand-research-${product.id}-${sequence}-${field}`,
      productId: product.id,
      fieldName: field,
      currentValue: product.baselineAttributes[field] ?? null,
      candidateValue,
      confidence: field === "brand" || field === "productName" || field === "ean" ? "high" : "medium",
      status: "proposed",
      sourceEvidenceIds: evidence.filter((record) => record.extractedFields[field] != null).map((record) => record.id),
      reason: candidateReasonForValue(field, evidenceValue, candidateValue),
    }]
  })

  return { evidence, candidates, evidenceValuesByField }
}

function applyResearchOutcome(state: DemoCatalogState, run: StoredResearchJob, timestamp: string) {
  const product = state.products.find((item) => item.id === run.productId)
  if (!product || run.applied) return run

  const { evidence, candidates, evidenceValuesByField } = buildResearchOutcome(product, state.researchRuns.length, timestamp)
  const acceptedFields = new Set(product.candidates.filter((candidate) => candidate.status === "accepted").map((candidate) => candidate.fieldName))
  const candidatesToApply = candidates.filter((candidate) => !acceptedFields.has(candidate.fieldName))
  const refreshedFields = new Set(candidatesToApply.map((candidate) => candidate.fieldName))
  const refreshedSources = new Set(evidence.map((record) => record.aggregatorId))

  product.candidates = product.candidates.filter((candidate) => {
    if (!refreshedFields.has(candidate.fieldName)) return true
    return candidate.status === "accepted"
  })
  const retainedEvidenceIds = new Set(product.candidates.flatMap((candidate) => candidate.sourceEvidenceIds))
  product.evidence = product.evidence.filter((record) => {
    if (!refreshedSources.has(record.aggregatorId)) return true
    return retainedEvidenceIds.has(record.id)
  })
  product.evidence.push(...evidence)
  product.candidates.push(...candidatesToApply)
  for (const candidate of candidatesToApply) {
    if (isExportableAttributeField(candidate.fieldName)) {
      product.bestEvidenceByField[candidate.fieldName] = evidenceValuesByField.get(candidate.fieldName) ?? candidate.candidateValue
    }
  }
  if (candidatesToApply.length > 0) {
    product.listingStatus = "READY_FOR_REVIEW"
    product.warnings = [
      ...product.warnings.filter((warning) => !warning.startsWith("Research completed;")),
      "Research completed; source-backed candidate values are ready for review",
    ]
  } else {
    product.listingStatus = product.qualityScore < 80 || product.warnings.some((warning) => /missing|required/i.test(warning))
      ? "NEEDS_ENRICHMENT"
      : "READY_FOR_REVIEW"
    product.warnings = [
      ...product.warnings.filter((warning) => !warning.startsWith("Research completed;")),
      "Research completed; no source-backed changes found",
    ]
  }

  run.evidenceIds = evidence.map((record) => record.id)
  run.candidateIds = candidatesToApply.map((candidate) => candidate.id)
  run.summary = candidatesToApply.length > 0
    ? `Research completed. ${candidatesToApply.length} source-backed candidate values are ready for review.`
    : "Research completed. No source-backed candidate values were created; missing attributes were not fabricated."
  run.updatedAt = timestamp
  run.applied = true
  return run
}

function deriveResearchStatus(run: StoredResearchJob, currentTime: string): ResearchJobStatus {
  const elapsedMs = toMillis(currentTime) - toMillis(run.createdAt)
  const durationMs = getMockResearchAgentDurationMs()
  if (elapsedMs < Math.max(500, durationMs * 0.2)) return "QUEUED"
  if (elapsedMs < durationMs) return "RUNNING"
  return "SUCCEEDED"
}

export function createMockResearchRun(productId: string) {
  const state = readState()
  const product = state.products.find((item) => item.id === productId)
  if (!product) return null

  const existing = state.researchRuns.find((run) => run.productId === productId && run.status !== "SUCCEEDED")
  if (existing) return existing

  const sequence = state.researchRuns.length + 1
  const timestamp = now()
  const run: StoredResearchJob = {
    id: `research-${product.id}-${sequence}`,
    productId,
    status: "QUEUED",
    runner: "opencode-lightweb",
    createdAt: timestamp,
    updatedAt: timestamp,
    summary: "Research queued.",
    evidenceIds: [],
    candidateIds: [],
    applied: false,
  }

  product.listingStatus = "RESEARCH_IN_PROGRESS"
  state.researchRuns.push(run)
  writeState(state)
  return run
}

export function listResearchRuns() {
  const state = readState()
  return state.researchRuns.map((run) => ({
    id: run.id,
    productId: run.productId,
    status: run.status,
    runner: run.runner,
    createdAt: run.createdAt,
    updatedAt: run.updatedAt,
    summary: run.summary,
    evidenceIds: [...run.evidenceIds],
    candidateIds: [...run.candidateIds],
  }))
}

export function getResearchRun(id: string, currentTime = now()) {
  const state = readState()
  const run = state.researchRuns.find((item) => item.id === id)
  if (!run) return null

  const nextStatus = deriveResearchStatus(run, currentTime)
  run.status = nextStatus

  if (nextStatus === "SUCCEEDED") {
    applyResearchOutcome(state, run, currentTime)
  } else {
    run.updatedAt = currentTime
  }

  writeState(state)
  return run
}

export function findCandidate(candidateId: string) {
  const state = readState()
  for (const product of state.products) {
    const candidate = product.candidates.find((item) => item.id === candidateId)
    if (candidate) return { state, product, candidate }
  }
  return null
}

export function addReviewDecision(candidateId: string, decision: ReviewDecision, reason?: string) {
  const found = findCandidate(candidateId)
  if (!found) return null

  const updatedCandidate = applyReviewDecisionToProduct(found.product, candidateId, decision, reason)
  if (!updatedCandidate) return null
  const schema = getStateProductSchema(found.state, found.product)
  if (schema) recomputeProductForAcceptedCandidates(found.product, schema)

  const record: ReviewDecisionRecord = {
    id: `review-${found.state.reviewDecisions.length + 1}`,
    candidateId,
    decision,
    reason,
    createdAt: now(),
  }

  found.state.reviewDecisions.push(record)
  writeState(found.state)
  return record
}

function warningMatchesSyncedField(warning: string, field: AttributeFieldId) {
  const normalized = warning.toLowerCase()
  const label = getFieldLabel(field).toLowerCase()

  if (normalized.includes(field.toLowerCase()) || normalized.includes(label)) return true
  if (field === "description" && /storefront|promotional|noise|descripci[oó]n|promocional|ruido comercial|tienda/.test(normalized)) return true
  if (field === "ean" && normalized.includes("ean")) return true
  if (field === "brand" && normalized.includes("brand")) return true
  return false
}

export function syncProductWithMirakl(productId: string, allowedFields?: readonly AttributeFieldId[]) {
  const state = readState()
  const product = state.products.find((item) => item.id === productId)
  const schema = product ? state.schemaOverrides[schemas.find((item) => item.id === product.schemaId)?.slug ?? ""] ?? schemas.find((item) => item.id === product.schemaId) : null
  if (!product || !schema) return null

  const allowedFieldSet = allowedFields ? new Set(allowedFields) : null
  const acceptedCandidates = getLatestAcceptedCandidates(product.candidates)
    .filter((candidate): candidate is CandidateRecord & { fieldName: AttributeFieldId } =>
      isExportableAttributeField(candidate.fieldName) && (!allowedFieldSet || allowedFieldSet.has(candidate.fieldName))
    )

  if (acceptedCandidates.length === 0) return { product, syncedFields: [] }

  const syncedFields = new Set<AttributeFieldId>()
  for (const candidate of acceptedCandidates) {
    product.baselineAttributes[candidate.fieldName] = candidate.candidateValue
    product.bestEvidenceByField[candidate.fieldName] = candidate.candidateValue
    syncedFields.add(candidate.fieldName)

    if (candidate.fieldName === "description") product.baselineDescription = candidate.candidateValue
    if (candidate.fieldName === "brand") product.brand = candidate.candidateValue
    if (candidate.fieldName === "productName") product.title = candidate.candidateValue
  }

  product.candidates = product.candidates.filter((candidate) =>
    candidate.status !== "accepted" || !isExportableAttributeField(candidate.fieldName) || !syncedFields.has(candidate.fieldName)
  )
  product.warnings = product.warnings.filter((warning) =>
    !warning.startsWith("Research completed;") && ![...syncedFields].some((field) => warningMatchesSyncedField(warning, field))
  )
  recomputeProductForSchema(product, schema, false)
  writeState(state)

  return { product, syncedFields: [...syncedFields] }
}

export function exportPreview(productId: string) {
  const state = readState()
  const product = state.products.find((item) => item.id === productId)
  if (!product) return null
  return buildExportPreview(product)
}
