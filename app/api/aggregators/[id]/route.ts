import { NextResponse } from "next/server"
import { aggregators } from "@/lib/fixtures"
import type { AggregatorDefinition, AggregatorType, ConfidenceLevel } from "@/lib/types"
import { updateStoredAggregator } from "@/server/store"

const confidenceLevels = new Set<ConfidenceLevel>(["high", "medium", "low"])
const aggregatorTypes = new Set<AggregatorType>(["manufacturer", "retailer", "marketplace", "spec_database", "review_site", "internal_reference", "partner_feed"])

function asStringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean) : []
}

function asAuthorityScore(value: unknown, fallback: number) {
  if (typeof value !== "number" || Number.isNaN(value)) return fallback
  return Math.min(100, Math.max(0, Math.round(value)))
}

function parseAggregatorPatch(existing: AggregatorDefinition, body: Record<string, unknown>): AggregatorDefinition {
  return {
    ...existing,
    name: typeof body.name === "string" && body.name.trim() ? body.name.trim() : existing.name,
    type: typeof body.type === "string" && aggregatorTypes.has(body.type as AggregatorType) ? body.type as AggregatorType : existing.type,
    baseUrl: typeof body.baseUrl === "string" && body.baseUrl.trim() ? body.baseUrl.trim() : existing.baseUrl,
    authorityScore: asAuthorityScore(body.authorityScore, existing.authorityScore),
    defaultConfidence: typeof body.defaultConfidence === "string" && confidenceLevels.has(body.defaultConfidence as ConfidenceLevel) ? body.defaultConfidence as ConfidenceLevel : existing.defaultConfidence,
    enabled: typeof body.enabled === "boolean" ? body.enabled : existing.enabled,
    coverageTags: asStringArray(body.coverageTags),
    sampleDomains: asStringArray(body.sampleDomains),
    description: typeof body.description === "string" ? body.description.trim() : existing.description,
    confidencePolicy: typeof body.confidencePolicy === "string" ? body.confidencePolicy.trim() : existing.confidencePolicy,
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const existing = aggregators.find((aggregator) => aggregator.id === id)
  if (!existing) return NextResponse.json({ error: "Aggregator not found" }, { status: 404 })

  const body = await request.json().catch(() => null)
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Expected an aggregator configuration object." }, { status: 400 })
  }

  const aggregator = updateStoredAggregator(aggregators, id, parseAggregatorPatch(existing, body as Record<string, unknown>))
  return NextResponse.json({ aggregator, message: "Aggregator configuration saved." })
}
