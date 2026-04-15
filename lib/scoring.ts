import type { ProductScoreBand } from "@/lib/types"

export function scoreBand(score: number): ProductScoreBand {
  if (score < 40) return "red"
  if (score < 70) return "amber"
  if (score < 85) return "neutral"
  return "green"
}

export function qualityScore(product: { brand: string | null; miraklDescription: string; attributes: Record<string, string | null>; warnings: string[] }) {
  const required = [product.brand, product.miraklDescription]
  const requiredScore = required.filter(Boolean).length / required.length * 35
  const attrEntries = Object.values(product.attributes)
  const attrScore = attrEntries.length === 0 ? 0 : attrEntries.filter(Boolean).length / attrEntries.length * 45
  const warningScore = product.warnings.length === 0 ? 20 : Math.max(0, 20 - product.warnings.length * 5)
  const score = Math.round(requiredScore + attrScore + warningScore)
  return { score, band: scoreBand(score) }
}
