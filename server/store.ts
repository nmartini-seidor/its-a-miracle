import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs"
import path from "node:path"
import { aggregators, demoSettings, products as seededProducts, schemas } from "../lib/fixtures.ts"
import { isExportableAttributeField } from "../lib/demo-contract.ts"
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

function recomputeProductForSchema(product: ProductRecord, schema: SchemaDefinition) {
  product.warnings = [
    ...product.warnings.filter((warning) => !/ missing for /.test(warning)),
    ...schemaMissingWarnings(product, schema),
  ]
  const scored = qualityScore(product, schema)
  product.qualityScore = scored.score
  product.scoreBand = scored.band
  if (product.listingStatus !== "RESEARCH_IN_PROGRESS" && product.listingStatus !== "EXPORT_READY") {
    product.listingStatus = getInitialStatus(scored.score, product.warnings)
  }
  return product
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
    aggregatorId: "official-manufacturer",
    sourceName: "Official manufacturer",
    sourceType: "manufacturer",
    baseUrl: "https://www.samsung.com/search/?searchvalue=",
    confidence: "high",
  },
  {
    aggregatorId: "spec-database",
    sourceName: "Specification database",
    sourceType: "spec_database",
    baseUrl: "https://www.gsmarena.com/results.php3?sQuickSearch=yes&sName=",
    confidence: "high",
  },
  {
    aggregatorId: "trusted-retailer",
    sourceName: "Trusted retailer",
    sourceType: "retailer",
    baseUrl: "https://www.bestbuy.com/site/searchpage.jsp?st=",
    confidence: "medium",
  },
] as const satisfies readonly {
  aggregatorId: string
  sourceName: string
  sourceType: EvidenceRecord["sourceType"]
  baseUrl: string
  confidence: EvidenceRecord["confidence"]
}[]

function hasAttributeValue(value: string | null | undefined) {
  return typeof value === "string" && value.trim().length > 0
}

function slugSearch(value: string) {
  return encodeURIComponent(value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim())
}

function getProductSchema(product: ProductRecord) {
  return schemas.find((schema) => schema.id === product.schemaId) ?? null
}

function deterministicDigits(seed: string, length: number) {
  let hash = 0
  for (const character of seed) hash = (hash * 31 + character.charCodeAt(0)) >>> 0
  let value = String(hash).padStart(length, "0")
  while (value.length < length) value += value
  return value.slice(0, length)
}

function getModelName(product: ProductRecord) {
  const baselineModel = product.baselineAttributes.model
  if (hasAttributeValue(baselineModel)) return baselineModel
  if (product.brand && product.title.toLowerCase().startsWith(product.brand.toLowerCase())) {
    return product.title.slice(product.brand.length).trim() || product.title
  }
  return product.title
}

function buildSeoDescription(product: ProductRecord) {
  const schema = getProductSchema(product)
  const brand = product.brand ?? product.baselineAttributes.brand ?? product.title.split(" ")[0]
  const model = product.baselineAttributes.model ?? product.baselineAttributes.productName ?? product.title
  const category = schema?.name.toLowerCase() ?? product.categoryPath.at(-1)?.toLowerCase() ?? "electrónica"
  const highlights = [
    product.baselineAttributes.displaySize,
    product.baselineAttributes.storage,
    product.baselineAttributes.ram,
    product.baselineAttributes.connectivity,
    product.baselineAttributes.resolution,
    product.baselineAttributes.batteryLife,
  ].filter(hasAttributeValue).slice(0, 3).join(", ")
  const specText = highlights ? ` Incluye ${highlights} para una ficha clara y fácil de comparar.` : " Incluye información estructurada para facilitar la revisión y la comparación."
  return `${brand} ${model} es un producto de ${category} preparado para ecommerce, con una descripción optimizada para SEO, orientada a búsqueda, conversión y revisión de atributos en Mirakl.${specText}`
}

function getResearchValue(product: ProductRecord, field: AttributeFieldId) {
  const baselineValue = product.baselineAttributes[field]
  const schema = getProductSchema(product)
  const category = product.categoryPath.join(" / ")

  switch (field) {
    case "brand":
      return product.brand ?? product.title.split(" ")[0]
    case "productName":
      return product.title
    case "ean":
      return hasAttributeValue(baselineValue) ? baselineValue : `84${deterministicDigits(product.id, 11)}`
    case "description":
      return buildSeoDescription(product)
    case "model":
      return getModelName(product)
    case "connectivity":
      if (/tv|monitor/i.test(category)) return "HDMI / Wi-Fi / Bluetooth"
      if (/gaming/i.test(category)) return "Wi-Fi / Bluetooth / USB-C"
      return "Wi-Fi / Bluetooth"
    case "bluetooth":
      return "Yes"
    case "bluetoothVersion":
      return /audio|headphones/i.test(category) ? "5.3" : "5.2"
    case "usbC":
      return "USB-C"
    case "weight":
      if (hasAttributeValue(baselineValue)) return baselineValue
      if (/headphones|audio/i.test(category)) return "250 g"
      if (/phone/i.test(category)) return "190 g"
      if (/tablet/i.test(category)) return "571 g"
      return "2.1 kg"
    case "batteryLife":
      return hasAttributeValue(baselineValue) ? baselineValue : "Up to 10 hours"
    case "batteryTechnology":
      return "Li-Ion"
    case "dimensions":
      return hasAttributeValue(baselineValue) ? baselineValue : "Product dimensions verified from technical specification"
    case "compatibility":
      if (/video games|gaming/i.test(category)) return "Current-generation console ecosystem"
      if (/audio|headphones/i.test(category)) return "iOS and Android"
      return "Windows, macOS, iOS, and Android"
    case "noiseReduction":
      return /audio|headphones/i.test(category) ? "Active noise reduction for calls" : "Not applicable"
    case "microphone":
      return "Integrated microphone array"
    case "storage":
      return hasAttributeValue(baselineValue) ? String(baselineValue).replace(/(\d+)GB/i, "$1 GB") : "256 GB"
    case "ram":
      return hasAttributeValue(baselineValue) ? String(baselineValue).replace(/(\d+)GB/i, "$1 GB") : "8 GB"
    case "displaySize":
      return hasAttributeValue(baselineValue) ? baselineValue : /tv/i.test(category) ? "55 in" : "6.7 in"
    case "resolution":
      return hasAttributeValue(baselineValue) ? baselineValue : /tv|monitor/i.test(category) ? "3840 x 2160" : "2400 x 1080"
    case "panelTechnology":
      return hasAttributeValue(baselineValue) ? baselineValue : /tv/i.test(category) ? "OLED" : "IPS"
    case "refreshRate":
      return "120 Hz"
    case "hdmiPorts":
      return "4 HDMI ports"
    case "stylusSupport":
      return /tablet/i.test(category) ? "Compatible stylus supported" : "Not applicable"
    case "batteryCapacity":
      if (hasAttributeValue(baselineValue)) return baselineValue
      if (/phone/i.test(category)) return "5000 mAh"
      if (/tablet/i.test(category)) return "10000 mAh"
      return "Rechargeable battery"
    case "cameraResolution":
      return hasAttributeValue(baselineValue) ? baselineValue : "50 MP"
  }
}

function getResearchCandidateFields(product: ProductRecord) {
  const schema = getProductSchema(product)
  const reviewFields = [...(schema?.requiredAttributes ?? []), ...(schema?.recommendedAttributes ?? [])]
  const preferred = reviewFields.filter((field) => !hasAttributeValue(product.baselineAttributes[field]))
  const normalized = reviewFields.filter((field) => hasAttributeValue(product.baselineAttributes[field]) && ["description", "storage", "ram", "weight", "dimensions"].includes(field))
  const selected = [...new Set([...preferred, ...normalized, ...reviewFields])]
  return selected.slice(0, Math.max(3, Math.min(6, selected.length)))
}

function fieldsForEvidence(candidateFields: AttributeFieldId[], evidenceIndex: number) {
  if (evidenceIndex === 0) return candidateFields.filter((_, index) => index % 3 !== 2)
  if (evidenceIndex === 1) return candidateFields.filter((_, index) => index % 3 !== 0)
  return candidateFields.filter((_, index) => index % 3 !== 1)
}

function buildResearchOutcome(product: ProductRecord, sequence: number, timestamp: string) {
  const candidateFields = getResearchCandidateFields(product)
  const valuesByField = new Map(candidateFields.map((field) => [field, getResearchValue(product, field)] as const))
  const search = slugSearch(product.title)

  const evidence = researchSourceTemplates.map((source, index): EvidenceRecord => {
    const evidenceFields = fieldsForEvidence(candidateFields, index)
    const extractedFields = evidenceFields.reduce<EvidenceRecord["extractedFields"]>((acc, field) => {
      const value = valuesByField.get(field)
      if (value != null) acc[field] = value
      return acc
    }, {})

    return {
      id: `ev-research-${product.id}-${sequence}-${index + 1}`,
      productId: product.id,
      aggregatorId: source.aggregatorId,
      sourceName: source.sourceName,
      sourceType: source.sourceType,
      sourceUrl: `${source.baseUrl}${search}`,
      title: `${source.sourceName} evidence for ${product.title}`,
      summary: `${source.sourceName} contributed evidence for ${candidateFields.length} candidate product-data fields.`,
      extractedFields,
      capturedAt: timestamp,
      confidence: source.confidence,
    }
  })

  const candidates = candidateFields.map((field): CandidateRecord => ({
    id: `cand-research-${product.id}-${sequence}-${field}`,
    productId: product.id,
    fieldName: field,
    currentValue: product.baselineAttributes[field] ?? null,
    candidateValue: valuesByField.get(field) ?? product.title,
    confidence: field === "brand" || field === "productName" || field === "ean" ? "high" : "medium",
    status: "proposed",
    sourceEvidenceIds: evidence.filter((record) => record.extractedFields[field] != null).map((record) => record.id),
    reason: "Generated by the research workflow from linked evidence sources.",
  }))

  return { evidence, candidates }
}

function applyResearchOutcome(state: DemoCatalogState, run: StoredResearchJob, timestamp: string) {
  const product = state.products.find((item) => item.id === run.productId)
  if (!product || run.applied) return run

  const { evidence, candidates } = buildResearchOutcome(product, state.researchRuns.length, timestamp)
  product.evidence.push(...evidence)
  product.candidates.push(...candidates)
  for (const candidate of candidates) {
    if (isExportableAttributeField(candidate.fieldName)) {
      product.bestEvidenceByField[candidate.fieldName] = candidate.candidateValue
    }
  }
  product.listingStatus = "READY_FOR_REVIEW"
  product.warnings = [
    ...product.warnings.filter((warning) => warning !== "Candidate EAN differs from Mirakl baseline"),
    "Research completed; new candidate values are ready for review",
  ]

  run.evidenceIds = evidence.map((record) => record.id)
  run.candidateIds = candidates.map((candidate) => candidate.id)
  run.summary = `Research completed. ${candidates.length} candidate values backed by ${evidence.length} evidence links are ready for review.`
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

function warningMatchesDescription(warning: string) {
  return /description|descripci[oó]n|storefront|promotional|promocional|ruido comercial/i.test(warning)
}

export function generateSeoDescriptionCandidate(productId: string) {
  const state = readState()
  const product = state.products.find((item) => item.id === productId)
  if (!product) return null

  const timestamp = now()
  const sequence = product.candidates.filter((candidate) => candidate.fieldName === "description").length + 1
  const evidenceId = `ev-seo-description-${product.id}-${sequence}`
  const candidateId = `cand-seo-description-${product.id}-${sequence}`
  const description = buildSeoDescription(product)

  const evidence: EvidenceRecord = {
    id: evidenceId,
    productId: product.id,
    aggregatorId: "ai-seo-agent",
    sourceName: "AI SEO generator",
    sourceType: "internal_reference",
    title: `SEO description generated for ${product.title}`,
    summary: "Generated Spanish ecommerce description for review before Mirakl synchronization.",
    extractedFields: { description },
    capturedAt: timestamp,
    confidence: "medium",
  }

  const candidate: CandidateRecord = {
    id: candidateId,
    productId: product.id,
    fieldName: "description",
    currentValue: product.baselineAttributes.description ?? null,
    candidateValue: description,
    confidence: "medium",
    status: "proposed",
    sourceEvidenceIds: [evidenceId],
    reason: "Generated by the AI SEO description workflow for operator review.",
  }

  product.evidence.push(evidence)
  product.candidates.push(candidate)
  product.bestEvidenceByField.description = description
  product.listingStatus = "READY_FOR_REVIEW"
  product.warnings = product.warnings.filter((warning) => !warningMatchesDescription(warning))
  writeState(state)
  return { product, candidate, evidence }
}

export function exportPreview(productId: string) {
  const state = readState()
  const product = state.products.find((item) => item.id === productId)
  if (!product) return null
  return buildExportPreview(product)
}
