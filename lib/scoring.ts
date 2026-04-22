import type { ProductRecord, ProductScoreBand } from "./types.ts"

export function scoreBand(score: number): ProductScoreBand {
  if (score < 25) return "red"
  if (score < 70) return "yellow"
  if (score < 90) return "blue"
  return "green"
}

export function qualityScore(product: Pick<ProductRecord, "brand" | "baselineDescription" | "baselineAttributes" | "warnings">) {
  const requiredScore = [product.brand, product.baselineDescription].filter(Boolean).length / 2 * 35
  const attributeValues = Object.values(product.baselineAttributes)
  const attributeScore = attributeValues.length === 0 ? 0 : attributeValues.filter(Boolean).length / attributeValues.length * 45
  const warningScore = product.warnings.length === 0 ? 20 : Math.max(0, 20 - product.warnings.length * 5)
  const score = Math.round(requiredScore + attributeScore + warningScore)
  return { score, band: scoreBand(score) }
}
