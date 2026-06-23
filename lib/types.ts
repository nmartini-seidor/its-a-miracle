export type ProductScoreBand = "red" | "yellow" | "blue" | "green"
export type ConfidenceLevel = "high" | "medium" | "low"
// Evidence source tier from docs/EVIDENCE_POLICY.md. The validator assigns this from the
// cited source type — it is never self-reported by an agent (ADR 0002). D is hard-rejected.
export type SourceTier = "A" | "B" | "C" | "D"
export type CandidateStatus = "proposed" | "accepted" | "rejected" | "needs_evidence"
export type ReviewDecision = "APPROVE" | "REJECT" | "REQUEST_MORE_EVIDENCE"
export type AggregatorType = "manufacturer" | "retailer" | "marketplace" | "spec_database" | "review_site" | "internal_reference" | "partner_feed"
export type ProductListingStatus = "READY_FOR_REVIEW" | "NEEDS_ENRICHMENT" | "RESEARCH_IN_PROGRESS" | "EXPORT_READY"
export type ResearchJobStatus = "QUEUED" | "RUNNING" | "SUCCEEDED" | "FAILED" | "TIMEOUT" | "CANCELLED"
// The three subscription-CLI runners a Research Job fans out to (ADR 0004). "opencode-lightweb"
// is the legacy single-runner label kept until the real worker (Phase 3) supersedes it.
export type ResearchRunnerId = "cursor" | "codex" | "claude"
export type ResearchMode = "single" | "multi"
export type AttributeFieldId =
  | "brand"
  | "productName"
  | "ean"
  | "connectivity"
  | "bluetooth"
  | "bluetoothVersion"
  | "usbC"
  | "weight"
  | "batteryLife"
  | "batteryTechnology"
  | "dimensions"
  | "compatibility"
  | "noiseReduction"
  | "microphone"
  | "model"
  | "storage"
  | "ram"
  | "displaySize"
  | "resolution"
  | "panelTechnology"
  | "refreshRate"
  | "hdmiPorts"
  | "stylusSupport"
  | "batteryCapacity"
  | "cameraResolution"
  | "description"

export type ContractFieldId = AttributeFieldId | "researchSummary"

export interface AggregatorDefinition {
  id: string
  name: string
  type: AggregatorType
  baseUrl: string
  authorityScore: number
  defaultConfidence: ConfidenceLevel
  enabled: boolean
  coverageTags: string[]
  sampleDomains: string[]
  description: string
  confidencePolicy: string
}

export interface SchemaDefinition {
  id: string
  slug: string
  name: string
  linkedCategories: string[]
  requiredAttributes: AttributeFieldId[]
  recommendedAttributes: AttributeFieldId[]
  warningRules: string[]
  scoringRules: string[]
  exampleProductIds: string[]
}

export interface EvidenceRecord {
  id: string
  productId: string
  aggregatorId: string
  sourceName: string
  sourceType: AggregatorType
  sourceUrl?: string
  title: string
  summary: string
  extractedFields: Partial<Record<ContractFieldId, string>>
  capturedAt: string
  confidence: ConfidenceLevel
  // Real-research provenance (Phase 2+). Optional so legacy/mock records stay valid.
  sourceTier?: SourceTier
  runner?: ResearchRunnerId
  snippet?: string
  accessedAt?: string
  extractionMethod?: string
}

export interface CandidateRecord {
  id: string
  productId: string
  fieldName: ContractFieldId
  currentValue: string | null
  candidateValue: string
  sourceEvidenceIds: string[]
  confidence: ConfidenceLevel
  status: CandidateStatus
  reason?: string
  // Multi-runner provenance (ADR 0004). `runner` is the originating runner for a competing
  // candidate; `runners` lists every runner that independently produced this same value
  // (agreement count = runners.length), which is what raises a consensus candidate's confidence.
  runner?: ResearchRunnerId
  runners?: ResearchRunnerId[]
}

export interface ProductRecord {
  id: string
  miraklProductId: string
  title: string
  brand: string | null
  categoryPath: string[]
  schemaId: string
  sourceUrl?: string
  listingStatus: ProductListingStatus
  qualityScore: number
  scoreBand: ProductScoreBand
  baselineDescription: string
  warnings: string[]
  baselineAttributes: Partial<Record<AttributeFieldId, string | null>>
  bestEvidenceByField: Partial<Record<AttributeFieldId, string | null>>
  candidates: CandidateRecord[]
  evidence: EvidenceRecord[]
}

export interface ResearchJob {
  id: string
  productId: string
  status: ResearchJobStatus
  // Job-level label: a single runner id, "multi" when fanned out across all three,
  // or the legacy "opencode-lightweb" mock label (retired in Phase 3).
  runner: ResearchRunnerId | "multi" | "opencode-lightweb"
  createdAt: string
  updatedAt: string
  summary: string
  evidenceIds: string[]
  candidateIds: string[]
}

// One runner's single attempt within a Research Job (CONTEXT.md "Runner Run").
// A multi-runner Job owns up to three of these, executed in parallel by the Worker.
export interface RunnerRun {
  id: string
  jobId: string
  productId: string
  runner: ResearchRunnerId
  status: ResearchJobStatus
  createdAt: string
  updatedAt: string
  startedAt?: string
  finishedAt?: string
  summary: string
  evidenceIds: string[]
  candidateIds: string[]
  error?: string
}

export interface ExportPreviewRow {
  field: AttributeFieldId
  value: string
  evidenceIds: string[]
}

export interface ExportPreview {
  productId: string
  miraklProductId: string
  status: "READY"
  rows: ExportPreviewRow[]
  message: string
}

export interface SettingsSnapshot {
  miraklBaseUrl: string
  environment: "demo"
  fakeResearchMode: boolean
  defaultResearchDelaySeconds: number
  maxEvidencePerProduct: number
  defaultCandidateConfidence: ConfidenceLevel
  autoAssignSchemaByCategory: boolean
  enabledAggregatorIds: string[]
}
