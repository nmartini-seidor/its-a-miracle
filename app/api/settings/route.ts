import { NextResponse } from "next/server"
import { aggregators } from "@/lib/fixtures"
import type { ConfidenceLevel, SettingsSnapshot } from "@/lib/types"
import { getStoredSettings, updateStoredSettings } from "@/server/store"

const confidenceLevels = new Set<ConfidenceLevel>(["high", "medium", "low"])
const aggregatorIds = new Set(aggregators.map((aggregator) => aggregator.id))

type SettingsPatch = Partial<Pick<
  SettingsSnapshot,
  | "miraklBaseUrl"
  | "fakeResearchMode"
  | "defaultResearchDelaySeconds"
  | "maxEvidencePerProduct"
  | "defaultCandidateConfidence"
  | "autoAssignSchemaByCategory"
  | "enabledAggregatorIds"
>>

function asBoolean(value: unknown) {
  return typeof value === "boolean" ? value : undefined
}

function asNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined
}

function parseSettingsPatch(body: Record<string, unknown>): SettingsPatch {
  const patch: SettingsPatch = {}

  if (typeof body.miraklBaseUrl === "string") patch.miraklBaseUrl = body.miraklBaseUrl.trim()
  if (typeof body.defaultCandidateConfidence === "string" && confidenceLevels.has(body.defaultCandidateConfidence as ConfidenceLevel)) {
    patch.defaultCandidateConfidence = body.defaultCandidateConfidence as ConfidenceLevel
  }

  const fakeResearchMode = asBoolean(body.fakeResearchMode)
  const autoAssignSchemaByCategory = asBoolean(body.autoAssignSchemaByCategory)
  const defaultResearchDelaySeconds = asNumber(body.defaultResearchDelaySeconds)
  const maxEvidencePerProduct = asNumber(body.maxEvidencePerProduct)

  if (typeof fakeResearchMode === "boolean") patch.fakeResearchMode = fakeResearchMode
  if (typeof autoAssignSchemaByCategory === "boolean") patch.autoAssignSchemaByCategory = autoAssignSchemaByCategory
  if (typeof defaultResearchDelaySeconds === "number") patch.defaultResearchDelaySeconds = defaultResearchDelaySeconds
  if (typeof maxEvidencePerProduct === "number") patch.maxEvidencePerProduct = maxEvidencePerProduct

  if (Array.isArray(body.enabledAggregatorIds)) {
    patch.enabledAggregatorIds = body.enabledAggregatorIds.filter((id): id is string => typeof id === "string" && aggregatorIds.has(id))
  }

  return patch
}

export async function GET() {
  return NextResponse.json({ settings: getStoredSettings() })
}

export async function PATCH(request: Request) {
  const body = await request.json().catch(() => null)
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Expected a settings object." }, { status: 400 })
  }

  const settings = updateStoredSettings(parseSettingsPatch(body as Record<string, unknown>))
  return NextResponse.json({ settings, message: "Workspace settings saved." })
}
