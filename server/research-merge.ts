import type {
  AttributeFieldId,
  CandidateRecord,
  ConfidenceLevel,
  EvidenceRecord,
  ResearchRunnerId,
} from "../lib/types.ts"

// Consensus/conflict merge (ADR 0004): combine the (up to three) Runner Runs of one Job per
// attribute field. Agreement across runs collapses to a single candidate with raised confidence;
// disagreement yields competing candidates, each tagged with its originating runner(s), so the
// field surfaces as a Conflict for the human reviewer — never silently merged.

export type RunnerOutputForMerge = {
  runner: ResearchRunnerId
  evidence: EvidenceRecord[]
  candidates: CandidateRecord[]
}

export type MergedResearch = {
  evidence: EvidenceRecord[]
  candidates: CandidateRecord[]
}

const CONFIDENCE_RANK: Record<ConfidenceLevel, number> = { low: 0, medium: 1, high: 2 }
const RANK_TO_CONFIDENCE: ConfidenceLevel[] = ["low", "medium", "high"]

function maxConfidence(levels: ConfidenceLevel[]): ConfidenceLevel {
  return levels.reduce<ConfidenceLevel>((best, level) => (CONFIDENCE_RANK[level] > CONFIDENCE_RANK[best] ? level : best), "low")
}

function bumpConfidence(level: ConfidenceLevel): ConfidenceLevel {
  return RANK_TO_CONFIDENCE[Math.min(2, CONFIDENCE_RANK[level] + 1)]
}

// Agreement across distinct runners raises confidence one level, but the tier cap still holds:
// a value with no manufacturer/operator (A/B) backing can never reach "high" however many
// retailers agree (consistent with the validator's rule).
function consensusConfidence(base: ConfidenceLevel, distinctRunnerCount: number, citedEvidence: EvidenceRecord[]): ConfidenceLevel {
  let confidence = base
  if (distinctRunnerCount >= 2) confidence = bumpConfidence(confidence)
  const hasHighTrust = citedEvidence.some((evidence) => evidence.sourceTier === "A" || evidence.sourceTier === "B")
  if (!hasHighTrust && confidence === "high") confidence = "medium"
  return confidence
}

export function canonicalizeValue(value: string): string {
  return value
    .toLowerCase()
    .replace(/\bwi[\s-]?fi\b/g, "wifi")
    .replace(/\s+/g, "")
    .replace(/[^\p{Letter}\p{Number}.]/gu, "")
}

function pickRepresentativeValue(candidates: CandidateRecord[]): string {
  // Prefer the value from the highest-confidence candidate; break ties by the longest (most
  // complete) string. They are canonically equal, so this only picks the best formatting.
  return [...candidates]
    .sort((a, b) => {
      const byConfidence = CONFIDENCE_RANK[b.confidence] - CONFIDENCE_RANK[a.confidence]
      if (byConfidence !== 0) return byConfidence
      return b.candidateValue.length - a.candidateValue.length
    })[0].candidateValue
}

function distinctRunners(candidates: CandidateRecord[]): ResearchRunnerId[] {
  const runners = new Set<ResearchRunnerId>()
  for (const candidate of candidates) {
    for (const runner of candidate.runners ?? (candidate.runner ? [candidate.runner] : [])) runners.add(runner)
  }
  return [...runners]
}

export function mergeRunnerRuns(runs: RunnerOutputForMerge[], productId: string): MergedResearch {
  const allEvidence = runs.flatMap((run) => run.evidence)
  const evidenceById = new Map(allEvidence.map((evidence) => [evidence.id, evidence]))

  // Group every produced candidate by attribute field.
  const byField = new Map<AttributeFieldId, CandidateRecord[]>()
  for (const run of runs) {
    for (const candidate of run.candidates) {
      const field = candidate.fieldName as AttributeFieldId
      const list = byField.get(field) ?? []
      list.push(candidate)
      byField.set(field, list)
    }
  }

  const mergedCandidates: CandidateRecord[] = []

  for (const [field, fieldCandidates] of byField) {
    // Group this field's candidates by canonical value.
    const byValue = new Map<string, CandidateRecord[]>()
    for (const candidate of fieldCandidates) {
      const key = canonicalizeValue(candidate.candidateValue)
      const list = byValue.get(key) ?? []
      list.push(candidate)
      byValue.set(key, list)
    }
    const valueGroups = [...byValue.values()]
    const currentValue = fieldCandidates[0].currentValue
    const isConflict = valueGroups.length > 1

    for (const group of valueGroups) {
      const runners = distinctRunners(group)
      const citedEvidenceIds = [...new Set(group.flatMap((candidate) => candidate.sourceEvidenceIds))]
      const citedEvidence = citedEvidenceIds.map((id) => evidenceById.get(id)).filter((e): e is EvidenceRecord => Boolean(e))
      const base = maxConfidence(group.map((candidate) => candidate.confidence))
      const confidence = consensusConfidence(base, runners.length, citedEvidence)
      const value = pickRepresentativeValue(group)
      const runnerSuffix = isConflict ? `-${[...runners].sort().join("-")}` : ""
      const reason = isConflict
        ? `Proposed by ${runners.join(", ")} — conflicts with other runners on ${field}.`
        : runners.length >= 2
          ? `Consensus across ${runners.join(", ")}.`
          : `Proposed by ${runners[0] ?? "a runner"}.`

      mergedCandidates.push({
        id: `cand-merge-${productId}-${field}${runnerSuffix}`,
        productId,
        fieldName: field,
        currentValue,
        candidateValue: value,
        sourceEvidenceIds: citedEvidenceIds,
        confidence,
        status: "proposed",
        reason,
        runner: runners[0],
        runners,
      })
    }
  }

  // Keep only evidence cited by a surviving merged candidate.
  const citedIds = new Set(mergedCandidates.flatMap((candidate) => candidate.sourceEvidenceIds))
  const evidence = allEvidence.filter((record) => citedIds.has(record.id))

  return { evidence, candidates: mergedCandidates }
}
