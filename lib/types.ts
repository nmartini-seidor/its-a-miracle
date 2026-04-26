export type ProductScoreBand = "red" | "yellow" | "blue" | "green"
export type ConfidenceLevel = "high" | "medium" | "low"
export type CandidateStatus = "proposed" | "accepted" | "rejected" | "needs_evidence"
export type ReviewDecision = "APPROVE" | "REJECT" | "REQUEST_MORE_EVIDENCE"
export type AggregatorType = "manufacturer" | "retailer" | "marketplace" | "spec_database" | "review_site" | "internal_reference" | "partner_feed"
export type ProductListingStatus = "READY_FOR_REVIEW" | "NEEDS_ENRICHMENT" | "RESEARCH_IN_PROGRESS" | "EXPORT_READY"
export type ResearchJobStatus = "QUEUED" | "RUNNING" | "SUCCEEDED"
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
}

export interface ProductRecord {
  id: string
  miraklProductId: string
  title: string
  brand: string | null
  categoryPath: string[]
  schemaId: string
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
  runner: "opencode-lightweb"
  createdAt: string
  updatedAt: string
  summary: string
  evidenceIds: string[]
  candidateIds: string[]
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
  fakeResearchMode: true
  defaultResearchDelaySeconds: number
  maxEvidencePerProduct: number
  defaultCandidateConfidence: ConfidenceLevel
  autoAssignSchemaByCategory: boolean
  enabledAggregatorIds: string[]
}
