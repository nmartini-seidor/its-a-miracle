import { z } from "zod"
import { ATTRIBUTE_FIELD_IDS, getFieldLabel } from "./demo-contract.ts"
import type {
  AggregatorType,
  AttributeFieldId,
  CandidateRecord,
  ConfidenceLevel,
  EvidenceRecord,
  ProductRecord,
  ResearchRunnerId,
  SchemaDefinition,
  SourceTier,
} from "./types.ts"

// The research trust boundary (ADR 0002 / docs/EVIDENCE_POLICY.md):
// - The only trusted output of a runner is the output.json it drops in its jail.
// - One zod source both *generates* the JSON Schema handed to the agent AND *validates* the file.
// - Confidence is assigned HERE from the cited source tier — never self-reported by the agent.
// - Candidates with no surviving evidence are dropped; D-tier sources are hard-rejected;
//   retailer/marketplace/snippet-only candidates are capped (cannot be "high").

export const RESEARCH_CONTRACT_VERSION = "2026-06-real-research-1"

// The runner pool a multi-runner Research Job fans out to (ADR 0004). Defined here (no node
// dependencies) so both the store and the worker share one source of truth.
export const RESEARCH_RUNNER_IDS: ResearchRunnerId[] = ["cursor", "codex", "claude"]

// ---------------------------------------------------------------------------
// Source types an agent may cite, and the policy our validator applies to each.
// ---------------------------------------------------------------------------
// Source types a *web-browsing* runner may claim. Deliberately excludes "mirakl" and
// "operator_document": those are our internal / operator-supplied inputs, not things an agent
// fetches from the open web — allowing them just hands an attacker a free tier-A/B label
// (red-team finding). An agent that claims them lands in the unknown→rejected bucket.
export const SOURCE_TYPES = [
  "manufacturer_official",
  "manufacturer_pdf",
  "spec_database",
  "review_site",
  "retailer",
  "marketplace",
  "search_snippet",
  "forum_social",
  "unattributed",
] as const
export type AgentSourceType = (typeof SOURCE_TYPES)[number]

type SourcePolicy = {
  tier: SourceTier
  baseConfidence: ConfidenceLevel
  allowed: boolean
  aggregatorType: AggregatorType
  label: string
}

export const SOURCE_POLICY: Record<AgentSourceType, SourcePolicy> = {
  manufacturer_official: { tier: "A", baseConfidence: "high", allowed: true, aggregatorType: "manufacturer", label: "Manufacturer official page" },
  manufacturer_pdf: { tier: "A", baseConfidence: "high", allowed: true, aggregatorType: "manufacturer", label: "Manufacturer datasheet/PDF" },
  spec_database: { tier: "C", baseConfidence: "medium", allowed: true, aggregatorType: "spec_database", label: "Specification database" },
  review_site: { tier: "C", baseConfidence: "medium", allowed: true, aggregatorType: "review_site", label: "Independent review/lab" },
  retailer: { tier: "C", baseConfidence: "medium", allowed: true, aggregatorType: "retailer", label: "Retailer product page" },
  marketplace: { tier: "C", baseConfidence: "low", allowed: true, aggregatorType: "marketplace", label: "Marketplace listing" },
  search_snippet: { tier: "C", baseConfidence: "low", allowed: true, aggregatorType: "review_site", label: "Search snippet" },
  forum_social: { tier: "D", baseConfidence: "low", allowed: false, aggregatorType: "review_site", label: "Forum/social (rejected)" },
  unattributed: { tier: "D", baseConfidence: "low", allowed: false, aggregatorType: "review_site", label: "Unattributed (rejected)" },
}

// Unknown / unmapped source types are treated as untrusted (D-tier, rejected) — a free-roaming
// agent must not slip a value in under a label we never sanctioned.
const UNKNOWN_SOURCE_POLICY: SourcePolicy = {
  tier: "D",
  baseConfidence: "low",
  allowed: false,
  aggregatorType: "review_site",
  label: "Unknown source (rejected)",
}

const TIER_STRICTNESS: Record<SourceTier, number> = { A: 0, B: 1, C: 2, D: 3 }

// Hostname ground-truth: a claimed source type can never UPGRADE trust above what the host
// warrants. A retailer/forum/blog page self-labeled "manufacturer_official" is capped/rejected by
// its host (red-team finding: source-label spoofing). Unknown hosts (incl. real manufacturer
// domains we can't enumerate) are trusted as claimed — the operator still sees the URL to judge.
function hostPolicy(url: string): SourcePolicy | null {
  let host: string
  let pathname: string
  try {
    const parsed = new URL(url)
    host = parsed.hostname.toLowerCase()
    pathname = parsed.pathname.toLowerCase()
  } catch {
    return UNKNOWN_SOURCE_POLICY
  }
  if (/(reddit|forum|community|facebook|twitter|^x\.com$|instagram|youtube|quora|tiktok|discord|pinterest)/.test(host) || /\/r\//.test(pathname)) {
    return { ...UNKNOWN_SOURCE_POLICY, label: "Forum/social host (rejected)" }
  }
  if (/(amazon|ebay|aliexpress|wish\.|etsy|alibaba|mercadolibre)/.test(host)) return SOURCE_POLICY.marketplace
  if (/(blog|medium\.com|wordpress|substack|tumblr)/.test(host)) return SOURCE_POLICY.search_snippet
  if (/(mediamarkt|elcorteingles|fnac|pccomponentes|currys|bestbuy|newegg|coolblue|backmarket|maxmovil|carrefour)/.test(host)) {
    return SOURCE_POLICY.retailer
  }
  // Generic commerce host tokens strongly imply a reseller, not a manufacturer — cap at retailer.
  // This under-trusts a manufacturer's own store (e.g. store.apple.com) to medium, which is the
  // safe direction; the operator still sees the URL and can approve.
  if (/(shop|store|tienda|boutique|checkout|\bdeals\b|outlet|comprar)/.test(host)) return SOURCE_POLICY.retailer
  return null
}

// Effective policy = the stricter (lower-trust) of the agent's claimed type and the host's truth.
function effectivePolicy(sourceType: string, url: string): SourcePolicy {
  const claimed = SOURCE_POLICY[sourceType as AgentSourceType] ?? UNKNOWN_SOURCE_POLICY
  const host = hostPolicy(url)
  if (!host) return claimed
  return TIER_STRICTNESS[host.tier] >= TIER_STRICTNESS[claimed.tier] ? host : claimed
}

const CONFIDENCE_RANK: Record<ConfidenceLevel, number> = { low: 0, medium: 1, high: 2 }

function maxConfidence(levels: ConfidenceLevel[]): ConfidenceLevel {
  return levels.reduce<ConfidenceLevel>((best, level) => (CONFIDENCE_RANK[level] > CONFIDENCE_RANK[best] ? level : best), "low")
}

// Candidate confidence = best confidence among its surviving evidence, but a candidate with no
// A/B-tier (manufacturer/operator) backing can never be "high" — retailer/marketplace/snippet
// only is capped at "medium" per EVIDENCE_POLICY.md / ADR 0002.
function candidateConfidence(evidences: Pick<EvidenceRecord, "confidence" | "sourceTier">[]): ConfidenceLevel {
  const best = maxConfidence(evidences.map((evidence) => evidence.confidence))
  const hasHighTrust = evidences.some((evidence) => evidence.sourceTier === "A" || evidence.sourceTier === "B")
  if (!hasHighTrust && best === "high") return "medium"
  return best
}

// ---------------------------------------------------------------------------
// Agent output contract (output.json). Source of truth for the embedded JSON Schema.
// ---------------------------------------------------------------------------
// Strict http(s) URL: must parse, http/https only, a real dotted host, and NO embedded
// credentials (the `https://a@data:text/html,...` userinfo trick slipped past a naive regex).
function isHttpUrl(value: string): boolean {
  let parsed: URL
  try {
    parsed = new URL(value)
  } catch {
    return false
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false
  if (parsed.username !== "" || parsed.password !== "") return false
  return parsed.hostname.includes(".") && !parsed.hostname.includes(":")
}

const MAX_VALUE_LENGTH: Partial<Record<AttributeFieldId, number>> = { description: 2000 }
const DEFAULT_MAX_VALUE_LENGTH = 240
const fieldIdSchema = z.enum(ATTRIBUTE_FIELD_IDS as [AttributeFieldId, ...AttributeFieldId[]])
const sourceTypeSchema = z.enum(SOURCE_TYPES)

export const agentEvidenceSchema = z.object({
  id: z.string().min(1).describe("A short id you assign, referenced by candidates (e.g. \"e1\")."),
  sourceType: sourceTypeSchema.describe("The kind of source you actually opened."),
  sourceUrl: z.string().refine(isHttpUrl, "must be an http(s) URL").describe("The exact URL you opened."),
  title: z.string().min(1).describe("Page or document title."),
  snippet: z.string().min(1).describe("Short verbatim excerpt from the page supporting the value."),
  accessedAt: z.string().optional().describe("ISO-8601 timestamp when you accessed the source."),
})

export const agentCandidateSchema = z.object({
  field: fieldIdSchema.describe("The attribute field this value is for."),
  value: z.string().min(1).describe("The proposed value (a string)."),
  evidenceIds: z.array(z.string().min(1)).min(1).describe("Ids of evidence entries that support this value (at least one)."),
  reason: z.string().optional().describe("Short note on why this value, if useful."),
})

export const agentOutputSchema = z.object({
  product: z.string().optional().describe("Echo of the product title, for sanity."),
  evidence: z.array(agentEvidenceSchema).describe("Every source you actually opened."),
  candidates: z.array(agentCandidateSchema).describe("Proposed field values, each citing evidence."),
})

export type AgentOutput = z.infer<typeof agentOutputSchema>

// The JSON Schema embedded verbatim in every mission so the agent sees exactly what we validate.
export const OUTPUT_JSON_SCHEMA = z.toJSONSchema(agentOutputSchema, { target: "draft-2020-12" })

// Loose top-level shape so a single malformed item does not nuke an otherwise-good run;
// individual items are validated with the strict item schemas above.
const looseOutputSchema = z.object({
  product: z.unknown().optional(),
  evidence: z.array(z.unknown()).optional(),
  candidates: z.array(z.unknown()).optional(),
})

// ---------------------------------------------------------------------------
// Mission contract (input handed to a runner; written as mission.json).
// ---------------------------------------------------------------------------
export type Mission = {
  missionVersion: string
  runner: ResearchRunnerId | "unspecified"
  product: {
    id: string
    miraklProductId: string
    title: string
    brand: string | null
    categoryPath: string[]
    baselineDescription: string
    baselineAttributes: Partial<Record<AttributeFieldId, string | null>>
  }
  schemaGaps: {
    required: AttributeFieldId[]
    recommended: AttributeFieldId[]
    missing: { field: AttributeFieldId; label: string }[]
  }
  allowedSourceTiers: SourceTier[]
  outputSchema: unknown
  instructions: string
}

function hasValue(value: string | null | undefined): value is string {
  return typeof value === "string" && value.trim().length > 0
}

export function buildMission(
  product: ProductRecord,
  schema: Pick<SchemaDefinition, "requiredAttributes" | "recommendedAttributes"> | null,
  runner: ResearchRunnerId | "unspecified" = "unspecified",
): Mission {
  const required = schema?.requiredAttributes ?? []
  const recommended = schema?.recommendedAttributes ?? []
  const missing = [...required, ...recommended]
    .filter((field, index, fields) => fields.indexOf(field) === index)
    .filter((field) => !hasValue(product.baselineAttributes[field]))
    .map((field) => ({ field, label: getFieldLabel(field) }))

  const instructions = [
    `You are a product-data research agent enriching a Mirakl catalog product.`,
    `Investigate the product "${product.title}" using the LIVE web and propose authoritative values for its missing/weak attribute fields.`,
    ``,
    `RULES (these are enforced by an automated validator — violating them silently drops your work):`,
    `- You MUST actually browse the web. Do not answer from memory.`,
    `- Every candidate value MUST cite at least one evidence entry (an exact URL you opened + a verbatim snippet). Uncited candidates are dropped.`,
    `- Prefer manufacturer official pages/datasheets (tier A). Retailer/marketplace/spec-database pages are acceptable supporting sources (tier C) but are capped at medium confidence.`,
    `- Forums, social media and unattributed/user-generated content (tier D) are REJECTED — do not cite them.`,
    `- Do NOT fabricate. If you cannot find a value with a real source, omit the field. An omitted field beats a guessed one.`,
    `- Do NOT self-report a confidence score; confidence is assigned by the reviewer from your cited source.`,
    `- Only set sourceType to one of: ${SOURCE_TYPES.join(", ")}.`,
    `- Propose values only for these field ids: ${ATTRIBUTE_FIELD_IDS.join(", ")}.`,
    ``,
    `OUTPUT: write a single file named output.json in your current working directory that validates against the JSON Schema in this mission's "outputSchema". Write nothing else to that file. Then stop.`,
  ].join("\n")

  return {
    missionVersion: RESEARCH_CONTRACT_VERSION,
    runner,
    product: {
      id: product.id,
      miraklProductId: product.miraklProductId,
      title: product.title,
      brand: product.brand,
      categoryPath: product.categoryPath,
      baselineDescription: product.baselineDescription,
      baselineAttributes: product.baselineAttributes,
    },
    schemaGaps: { required, recommended, missing },
    allowedSourceTiers: ["A", "B", "C"],
    outputSchema: OUTPUT_JSON_SCHEMA,
    instructions,
  }
}

// ---------------------------------------------------------------------------
// Validator: raw output.json -> trusted EvidenceRecord[] + CandidateRecord[].
// ---------------------------------------------------------------------------
export type ValidationContext = {
  productId: string
  runner: ResearchRunnerId
  sequence: number
  baselineAttributes?: Partial<Record<AttributeFieldId, string | null>>
  now?: string
}

export type ValidatedRunnerOutput = {
  structurallyValid: boolean
  evidence: EvidenceRecord[]
  candidates: CandidateRecord[]
  diagnostics: {
    structuralErrors: string[]
    droppedEvidence: { reason: string; detail?: string }[]
    droppedCandidates: { reason: string; field?: string }[]
  }
}

function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "")
  } catch {
    return url
  }
}

// Strip control characters, collapse whitespace, and cap length per field so an agent cannot
// smuggle an unbounded free-text / prompt-injection blob into a candidate value (red-team finding).
function sanitizeValue(field: AttributeFieldId, raw: string): string {
  const cleaned = raw.replace(/[\u0000-\u001F\u007F]/g, " ").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()
  const max = MAX_VALUE_LENGTH[field] ?? DEFAULT_MAX_VALUE_LENGTH
  return cleaned.length > max ? cleaned.slice(0, max).trim() : cleaned
}

export function validateRunnerOutput(raw: unknown, ctx: ValidationContext): ValidatedRunnerOutput {
  const now = ctx.now ?? new Date().toISOString()
  const diagnostics: ValidatedRunnerOutput["diagnostics"] = { structuralErrors: [], droppedEvidence: [], droppedCandidates: [] }

  const parsed = looseOutputSchema.safeParse(raw)
  if (!parsed.success) {
    return {
      structurallyValid: false,
      evidence: [],
      candidates: [],
      diagnostics: { ...diagnostics, structuralErrors: parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`) },
    }
  }

  const rawEvidence = parsed.data.evidence ?? []
  const rawCandidates = parsed.data.candidates ?? []

  // 1. Validate + map evidence; index by the agent's local id. Drop D-tier / disallowed / unknown.
  const evidenceByAgentId = new Map<string, EvidenceRecord>()
  rawEvidence.forEach((item, index) => {
    const result = agentEvidenceSchema.safeParse(item)
    if (!result.success) {
      diagnostics.droppedEvidence.push({ reason: "schema", detail: result.error.issues.map((issue) => issue.message).join("; ") })
      return
    }
    const evidence = result.data
    const policy = effectivePolicy(evidence.sourceType, evidence.sourceUrl)
    if (!policy.allowed) {
      diagnostics.droppedEvidence.push({ reason: `tier_${policy.tier}_rejected`, detail: `${evidence.sourceType} @ ${hostnameOf(evidence.sourceUrl)}` })
      return
    }
    const record: EvidenceRecord = {
      id: `ev-${ctx.runner}-${ctx.productId}-${ctx.sequence}-${index + 1}`,
      productId: ctx.productId,
      aggregatorId: `${ctx.runner}-${evidence.sourceType}`,
      sourceName: hostnameOf(evidence.sourceUrl),
      sourceType: policy.aggregatorType,
      sourceUrl: evidence.sourceUrl,
      title: evidence.title,
      summary: evidence.snippet.length > 280 ? `${evidence.snippet.slice(0, 277)}…` : evidence.snippet,
      extractedFields: {},
      capturedAt: now,
      confidence: policy.baseConfidence,
      sourceTier: policy.tier,
      runner: ctx.runner,
      snippet: evidence.snippet,
      accessedAt: evidence.accessedAt ?? now,
      extractionMethod: "agent_web_research",
    }
    // Reference key is the trimmed agent id; whitespace-only ids are un-auditable and dropped.
    const agentId = evidence.id.trim()
    if (!agentId) {
      diagnostics.droppedEvidence.push({ reason: "blank_id" })
      return
    }
    // First write wins on a duplicated agent id (collision is the agent's fault, not data we trust).
    if (!evidenceByAgentId.has(agentId)) evidenceByAgentId.set(agentId, record)
  })

  // 2. Validate candidates; require ≥1 surviving evidence; assign confidence from cited tiers.
  const candidates: CandidateRecord[] = []
  const citedEvidenceIds = new Set<string>()
  rawCandidates.forEach((item) => {
    const result = agentCandidateSchema.safeParse(item)
    if (!result.success) {
      diagnostics.droppedCandidates.push({ reason: "schema" })
      return
    }
    const candidate = result.data
    // Dedupe citations (one source cited three times must not forge multi-source corroboration).
    const uniqueEvidenceIds = [...new Set(candidate.evidenceIds.map((id) => id.trim()).filter(Boolean))]
    const survivingEvidence = uniqueEvidenceIds
      .map((agentId) => evidenceByAgentId.get(agentId))
      .filter((evidence): evidence is EvidenceRecord => Boolean(evidence))
    if (survivingEvidence.length === 0) {
      diagnostics.droppedCandidates.push({ reason: "no_surviving_evidence", field: candidate.field })
      return
    }
    const value = sanitizeValue(candidate.field, candidate.value)
    if (!value) {
      diagnostics.droppedCandidates.push({ reason: "empty_value", field: candidate.field })
      return
    }
    const confidence = candidateConfidence(survivingEvidence)
    const record: CandidateRecord = {
      id: `cand-${ctx.runner}-${ctx.productId}-${ctx.sequence}-${candidate.field}`,
      productId: ctx.productId,
      fieldName: candidate.field,
      currentValue: ctx.baselineAttributes?.[candidate.field] ?? null,
      candidateValue: value,
      sourceEvidenceIds: survivingEvidence.map((evidence) => evidence.id),
      confidence,
      status: "proposed",
      reason: candidate.reason,
      runner: ctx.runner,
      runners: [ctx.runner],
    }
    candidates.push(record)
    for (const evidence of survivingEvidence) {
      evidence.extractedFields[candidate.field] = value
      citedEvidenceIds.add(evidence.id)
    }
  })

  // 3. Keep only evidence that actually backs a surviving candidate (drop orphan sources).
  const evidence = [...evidenceByAgentId.values()].filter((record) => citedEvidenceIds.has(record.id))

  return { structurallyValid: true, evidence, candidates, diagnostics }
}

// Whether the worker should spend its single repair-retry: only when the structure was broken,
// or every candidate the agent produced was thrown out for a structural (not policy) reason.
export function shouldRepairRetry(result: ValidatedRunnerOutput, rawHadCandidates: boolean): boolean {
  if (!result.structurallyValid) return true
  if (!rawHadCandidates) return false
  const allDropped = result.candidates.length === 0
  const anyStructuralDrop = result.diagnostics.droppedCandidates.some((drop) => drop.reason === "schema")
  return allDropped && anyStructuralDrop
}
