import { products } from "@/lib/fixtures"
import type { EnrichmentCandidate, EvidenceSource } from "@/lib/types"

type ReviewDecision = {
  id: string
  candidateId: string
  decision: "APPROVE" | "REJECT" | "REQUEST_MORE_EVIDENCE"
  reason?: string
  createdAt: string
}

type ResearchRun = {
  id: string
  productId: string
  status: "QUEUED" | "SUCCEEDED"
  runner: "mock-opencode-lightweb"
  createdAt: string
  summary: string
  evidenceIds: string[]
  candidateIds: string[]
}

const researchRuns = new Map<string, ResearchRun>()
const reviewDecisions: ReviewDecision[] = []

function now() { return new Date().toISOString() }

export function createMockResearchRun(productId: string) {
  const product = products.find((item) => item.id === productId)
  if (!product) return null
  const runId = `mock-research-${product.id}-${researchRuns.size + 1}`
  const evidence: EvidenceSource = { id: `ev-research-${product.id}-${researchRuns.size + 1}`, sourceType: "manufacturer_page", title: `${product.title} official research placeholder`, accessedAt: now(), excerpt: "Mock bounded research runner found candidate fields without mutating Mirakl.", confidence: "medium" }
  const candidate: EnrichmentCandidate = { id: `cand-research-${product.id}-${researchRuns.size + 1}`, fieldPath: "Research summary", currentValue: null, candidateValue: `Research job ${runId} produced additional evidence for ${product.title}.`, confidence: "medium", status: "proposed", evidenceIds: [evidence.id] }
  product.evidence.push(evidence)
  product.candidates.push(candidate)
  const run: ResearchRun = { id: runId, productId, status: "SUCCEEDED", runner: "mock-opencode-lightweb", createdAt: now(), summary: "Mock research completed. No Mirakl writes were performed.", evidenceIds: [evidence.id], candidateIds: [candidate.id] }
  researchRuns.set(runId, run)
  return run
}

export function getResearchRun(id: string) { return researchRuns.get(id) ?? null }

export function findCandidate(candidateId: string) {
  for (const product of products) {
    const candidate = product.candidates.find((item) => item.id === candidateId)
    if (candidate) return { product, candidate }
  }
  return null
}

export function addReviewDecision(candidateId: string, decision: ReviewDecision["decision"], reason?: string) {
  const found = findCandidate(candidateId)
  if (!found) return null
  const record: ReviewDecision = { id: `review-${reviewDecisions.length + 1}`, candidateId, decision, reason, createdAt: now() }
  reviewDecisions.push(record)
  found.candidate.status = decision === "APPROVE" ? "accepted" : decision === "REJECT" ? "rejected" : "needs_evidence"
  return record
}

export function exportPreview(productId: string) {
  const product = products.find((item) => item.id === productId)
  if (!product) return null
  const accepted = product.candidates.filter((candidate) => candidate.status === "accepted")
  return { product_id: product.id, source_sku: product.sourceSku, status: "DRAFT_PREVIEW_ONLY", rows: accepted.map((candidate) => ({ field: candidate.fieldPath, value: candidate.candidateValue, evidence_ids: candidate.evidenceIds })), safety: "Preview only; no Mirakl import is generated or submitted." }
}
