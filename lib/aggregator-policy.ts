import type { AggregatorDefinition } from "@/lib/types"

export type AuthorityTier = {
  id: "canonical-anchor" | "trusted-specialist" | "corroborating-source" | "supporting-only"
  label: string
  range: string
  colorClassName: string
  badgeClassName: string
  summary: string
  importance: string
}

export function getAuthorityTier(authorityScore: number): AuthorityTier {
  if (authorityScore >= 90) {
    return {
      id: "canonical-anchor",
      label: "Canonical anchor",
      range: "90–100",
      colorClassName: "border-emerald-200 bg-emerald-50 text-emerald-950",
      badgeClassName: "border-emerald-200 bg-emerald-100 text-emerald-900",
      summary: "Direct source for brand, naming, and official specifications.",
      importance: "Can anchor candidate values when the evidence is direct and field-specific.",
    }
  }

  if (authorityScore >= 80) {
    return {
      id: "trusted-specialist",
      label: "Trusted specialist",
      range: "80–89",
      colorClassName: "border-blue-200 bg-blue-50 text-blue-950",
      badgeClassName: "border-blue-200 bg-blue-100 text-blue-900",
      summary: "Strong structured or policy evidence that still expects review context.",
      importance: "Can strongly support technical values, but should be checked against source context.",
    }
  }

  if (authorityScore >= 60) {
    return {
      id: "corroborating-source",
      label: "Corroborating source",
      range: "60–79",
      colorClassName: "border-amber-200 bg-amber-50 text-amber-950",
      badgeClassName: "border-amber-200 bg-amber-100 text-amber-900",
      summary: "Useful supporting signal for visible specs and merchandising details.",
      importance: "Good for corroboration; should not decide canonical fields by itself.",
    }
  }

  return {
    id: "supporting-only",
    label: "Supporting only",
    range: "0–59",
    colorClassName: "border-rose-200 bg-rose-50 text-rose-950",
    badgeClassName: "border-rose-200 bg-rose-100 text-rose-900",
    summary: "Low-authority source for hints, variants, and weak corroboration.",
    importance: "Never enough on its own for export-ready canonical values.",
  }
}

export function getConfidenceSummary({ authorityScore, defaultConfidence, type }: Pick<AggregatorDefinition, "authorityScore" | "defaultConfidence" | "type">) {
  if (type === "internal_reference") return "Operator guidance for review decisions and export policy."
  if (defaultConfidence === "high" && authorityScore >= 90) return "Starts high because the provider can anchor canonical fields when direct evidence is available."
  if (defaultConfidence === "high") return "Starts high for structured technical evidence, with corroboration expected in the review flow."
  if (defaultConfidence === "medium") return "Starts medium until a stronger source confirms the field or the evidence is clearly visible."
  return "Starts low and stays supporting-only unless a stronger source confirms the same claim."
}
