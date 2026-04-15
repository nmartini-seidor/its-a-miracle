export type ProductScoreBand = "red" | "amber" | "neutral" | "green"
export type CandidateStatus = "proposed" | "accepted" | "rejected" | "needs_evidence"
export type EvidenceType = "mirakl_baseline" | "orange_page" | "retailer_reference" | "manufacturer_page" | "manual_operator_note"

export interface EvidenceSource {
  id: string
  sourceType: EvidenceType
  title: string
  url?: string
  accessedAt: string
  excerpt: string
  confidence: "high" | "medium" | "low"
}

export interface EnrichmentCandidate {
  id: string
  fieldPath: string
  currentValue: string | null
  candidateValue: string
  confidence: "high" | "medium" | "low"
  status: CandidateStatus
  evidenceIds: string[]
}

export interface ProductBaseline {
  id: string
  sourceSku: string
  title: string
  brand: string | null
  categoryPath: string[]
  ean: string
  status: string
  score: number
  scoreBand: ProductScoreBand
  miraklDescription: string
  orangeDescription?: string
  orangeUrl?: string
  warnings: string[]
  attributes: Record<string, string | null>
  orangeAttributes: Record<string, string | null>
  candidates: EnrichmentCandidate[]
  evidence: EvidenceSource[]
}
