import { getFieldLabel, isAttributeFieldId } from "./demo-contract.ts"
import type { AttributeFieldId, CandidateRecord, ProductRecord, SchemaDefinition } from "./types.ts"

export type ReviewFieldRow = {
  field: AttributeFieldId
  label: string
  baselineValue: string | null
  baselineProjected: boolean
  evidenceValue: string | null
  candidateValue: string | null
  candidateStatus: CandidateRecord["status"] | null
  candidateReason: string | null
  baselineMissing: boolean
  hasCandidate: boolean
  differsFromEvidence: boolean
  baselineNeedsAttention: boolean
  baselineWarnings: string[]
}

const REVIEW_CANDIDATE_STATUS_PRIORITY = {
  accepted: 4,
  proposed: 3,
  needs_evidence: 2,
  rejected: 1,
} satisfies Record<CandidateRecord["status"], number>

export function getReviewCandidates(product: ProductRecord) {
  return product.candidates.filter((candidate): candidate is CandidateRecord & { fieldName: AttributeFieldId } =>
    isAttributeFieldId(candidate.fieldName)
  )
}

export function getCandidateByField(product: ProductRecord) {
  const byField = new Map<AttributeFieldId, CandidateRecord>()

  getReviewCandidates(product).forEach((candidate) => {
    const existing = byField.get(candidate.fieldName)
    if (!existing) {
      byField.set(candidate.fieldName, candidate)
      return
    }

    const existingPriority = REVIEW_CANDIDATE_STATUS_PRIORITY[existing.status]
    const nextPriority = REVIEW_CANDIDATE_STATUS_PRIORITY[candidate.status]

    if (nextPriority >= existingPriority) {
      byField.set(candidate.fieldName, candidate)
    }
  })

  return byField
}

// All non-rejected candidates grouped by field, so the UI can surface a Conflict when more than
// one runner proposed competing values for the same field (ADR 0004). Within a field, accepted
// sorts first, then by confidence, so the most relevant competing value leads.
const CONFIDENCE_ORDER = { high: 3, medium: 2, low: 1 } as const

export function getCompetingCandidatesByField(product: ProductRecord) {
  const byField = new Map<AttributeFieldId, CandidateRecord[]>()
  for (const candidate of getReviewCandidates(product)) {
    if (candidate.status === "rejected") continue
    const list = byField.get(candidate.fieldName) ?? []
    list.push(candidate)
    byField.set(candidate.fieldName, list)
  }
  for (const list of byField.values()) {
    list.sort((a, b) => {
      if (a.status === "accepted" && b.status !== "accepted") return -1
      if (b.status === "accepted" && a.status !== "accepted") return 1
      return CONFIDENCE_ORDER[b.confidence] - CONFIDENCE_ORDER[a.confidence]
    })
  }
  return byField
}

// A field is conflicted when two or more distinct candidate values are still in play for it.
export function isFieldConflicted(candidates: CandidateRecord[]): boolean {
  const distinctValues = new Set(candidates.filter((c) => c.status !== "rejected").map((c) => c.candidateValue))
  return distinctValues.size > 1
}

export function orderReviewFields(product: ProductRecord, schema: SchemaDefinition | null) {
  const ordered = new Set<AttributeFieldId>()

  schema?.requiredAttributes.forEach((field) => ordered.add(field))
  schema?.recommendedAttributes.forEach((field) => ordered.add(field))
  Object.keys(product.baselineAttributes).forEach((field) => {
    if (isAttributeFieldId(field)) ordered.add(field)
  })
  Object.keys(product.bestEvidenceByField).forEach((field) => {
    if (isAttributeFieldId(field)) ordered.add(field)
  })
  getReviewCandidates(product).forEach((candidate) => ordered.add(candidate.fieldName))

  return [...ordered]
}

function warningMatchesField(warning: string, field: AttributeFieldId) {
  const normalized = warning.toLowerCase()
  const label = getFieldLabel(field).toLowerCase()

  if (normalized.includes(field.toLowerCase()) || normalized.includes(label)) return true
  if (field === "description" && /storefront|promotional|noise|descripci[oó]n|promocional|ruido comercial/.test(normalized)) return true
  if (field === "ean" && normalized.includes("ean")) return true
  if (field === "brand" && normalized.includes("brand")) return true
  return false
}

export function buildReviewFieldRows(product: ProductRecord, schema: SchemaDefinition | null): ReviewFieldRow[] {
  const candidateByField = getCandidateByField(product)
  const requiredFields = new Set(schema?.requiredAttributes ?? [])

  return orderReviewFields(product, schema).map((field) => {
    const candidate = candidateByField.get(field) ?? null
    const importedBaselineValue = field in product.baselineAttributes ? product.baselineAttributes[field as keyof typeof product.baselineAttributes] ?? null : null
    const evidenceValue = field in product.bestEvidenceByField ? product.bestEvidenceByField[field as keyof typeof product.bestEvidenceByField] ?? null : null
    const candidateValue = candidate?.candidateValue ?? null
    const candidateStatus = candidate?.status ?? null
    const candidateReason = candidate?.reason ?? null
    const baselineProjected = candidateStatus === "accepted" && candidateValue != null
    const baselineValue = baselineProjected ? candidateValue : importedBaselineValue
    const baselineMissing = baselineValue == null
    const baselineWarnings = baselineProjected ? [] : product.warnings.filter((warning) => warningMatchesField(warning, field))
    const baselineNeedsAttention = baselineWarnings.length > 0 || (baselineMissing && requiredFields.has(field))

    return {
      field,
      label: getFieldLabel(field),
      baselineValue,
      baselineProjected,
      evidenceValue,
      candidateValue,
      candidateStatus,
      candidateReason,
      baselineMissing,
      hasCandidate: candidateValue != null,
      differsFromEvidence: evidenceValue != null && candidateValue != null && evidenceValue !== candidateValue,
      baselineNeedsAttention,
      baselineWarnings,
    }
  })
}
