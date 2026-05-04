import type { AttributeFieldId, ProductRecord, ProductScoreBand, SchemaDefinition } from "./types.ts"

export function scoreBand(score: number): ProductScoreBand {
  if (score < 25) return "red"
  if (score < 70) return "yellow"
  if (score < 90) return "blue"
  return "green"
}

function hasValue(value: string | null | undefined) {
  return typeof value === "string" && value.trim().length > 0
}

function completenessScore(fields: readonly AttributeFieldId[], attributes: ProductRecord["baselineAttributes"], points: number) {
  if (fields.length === 0) return points
  const populated = fields.filter((field) => hasValue(attributes[field])).length
  return populated / fields.length * points
}

export function qualityScore(
  product: Pick<ProductRecord, "brand" | "baselineDescription" | "baselineAttributes" | "warnings" | "evidence">,
  schema?: Pick<SchemaDefinition, "requiredAttributes" | "recommendedAttributes"> | null,
) {
  const requiredFields = schema?.requiredAttributes ?? ["brand", "productName", "ean", "description"]
  const recommendedFields = schema?.recommendedAttributes ?? []
  const identityScore = [product.brand, product.baselineDescription].filter(hasValue).length / 2 * 15
  const requiredScore = completenessScore(requiredFields, product.baselineAttributes, 45)
  const recommendedScore = completenessScore(recommendedFields, product.baselineAttributes, 20)
  const evidenceScore = product.evidence.length > 0 ? 10 : 0
  const warningScore = Math.max(0, 10 - product.warnings.length * 4)
  const missingRequired = requiredFields.some((field) => !hasValue(product.baselineAttributes[field]))
  const hasQualityWarning = product.warnings.length > 0
  const rawScore = Math.round(identityScore + requiredScore + recommendedScore + evidenceScore + warningScore)
  const cappedForMissingRequired = missingRequired ? Math.min(rawScore, 69) : rawScore
  const cappedForWarnings = hasQualityWarning ? Math.min(cappedForMissingRequired, 84) : cappedForMissingRequired
  const cappedForSingleSource = product.evidence.length < 2 ? Math.min(cappedForWarnings, 95) : cappedForWarnings
  const score = Math.max(0, Math.min(100, cappedForSingleSource))
  return { score, band: scoreBand(score) }
}
