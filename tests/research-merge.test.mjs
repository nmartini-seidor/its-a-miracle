import assert from "node:assert/strict"
import { test } from "node:test"

const { mergeRunnerRuns, canonicalizeValue } = await import("../server/research-merge.ts")

function evidence(id, tier, conf) {
  return {
    id,
    productId: "p1",
    aggregatorId: id,
    sourceName: "host",
    sourceType: "manufacturer",
    sourceUrl: `https://maker.example.com/${id}`,
    title: "t",
    summary: "s",
    extractedFields: {},
    capturedAt: "2026-06-23T00:00:00Z",
    confidence: conf,
    sourceTier: tier,
  }
}

function candidate(runner, field, value, evId, conf) {
  return {
    id: `cand-${runner}-${field}`,
    productId: "p1",
    fieldName: field,
    currentValue: null,
    candidateValue: value,
    sourceEvidenceIds: [evId],
    confidence: conf,
    status: "proposed",
    runner,
    runners: [runner],
  }
}

test("agreement across runners collapses to one candidate tagged with all runners", () => {
  const runs = ["cursor", "codex", "claude"].map((runner) => ({
    runner,
    evidence: [evidence(`${runner}-e`, "A", "high")],
    candidates: [candidate(runner, "ean", "6942103169441", `${runner}-e`, "high")],
  }))
  const merged = mergeRunnerRuns(runs, "p1")
  assert.equal(merged.candidates.length, 1)
  assert.deepEqual([...merged.candidates[0].runners].sort(), ["claude", "codex", "cursor"])
  assert.equal(merged.candidates[0].confidence, "high")
  assert.equal(merged.candidates[0].sourceEvidenceIds.length, 3)
})

test("agreement raises confidence one level (medium -> high) when an A/B source backs it", () => {
  const runs = ["cursor", "codex"].map((runner) => ({
    runner,
    evidence: [evidence(`${runner}-e`, "A", "medium")],
    candidates: [candidate(runner, "weight", "37.8 g", `${runner}-e`, "medium")],
  }))
  const merged = mergeRunnerRuns(runs, "p1")
  assert.equal(merged.candidates[0].confidence, "high")
})

test("retailer-only consensus is capped at medium even with agreement", () => {
  const runs = ["cursor", "codex", "claude"].map((runner) => ({
    runner,
    evidence: [evidence(`${runner}-e`, "C", "medium")],
    candidates: [candidate(runner, "ean", "111", `${runner}-e`, "medium")],
  }))
  const merged = mergeRunnerRuns(runs, "p1")
  assert.equal(merged.candidates[0].confidence, "medium")
})

test("disagreement produces competing candidates per distinct value", () => {
  const runs = [
    { runner: "cursor", evidence: [evidence("c-e", "A", "high")], candidates: [candidate("cursor", "weight", "37.8 g", "c-e", "high")] },
    { runner: "claude", evidence: [evidence("cl-e", "A", "high")], candidates: [candidate("claude", "weight", "37.8 g", "cl-e", "high")] },
    { runner: "codex", evidence: [evidence("cx-e", "A", "high")], candidates: [candidate("codex", "weight", "38 g", "cx-e", "high")] },
  ]
  const merged = mergeRunnerRuns(runs, "p1")
  const weight = merged.candidates.filter((c) => c.fieldName === "weight")
  assert.equal(weight.length, 2)
  const agree = weight.find((c) => c.candidateValue === "37.8 g")
  const dissent = weight.find((c) => c.candidateValue === "38 g")
  assert.deepEqual([...agree.runners].sort(), ["claude", "cursor"])
  assert.deepEqual(dissent.runners, ["codex"])
  assert.equal(weight.every((c) => /conflict/i.test(c.reason)), true)
})

test("only evidence cited by a surviving candidate is kept", () => {
  const runs = [
    {
      runner: "cursor",
      evidence: [evidence("used", "A", "high"), evidence("orphan", "A", "high")],
      candidates: [candidate("cursor", "ean", "1", "used", "high")],
    },
  ]
  const merged = mergeRunnerRuns(runs, "p1")
  assert.equal(merged.evidence.length, 1)
  assert.equal(merged.evidence[0].id, "used")
})

test("canonicalizeValue treats formatting/case/wifi variants as equal", () => {
  assert.equal(canonicalizeValue("Wi-Fi 6") === canonicalizeValue("wifi 6"), true)
  assert.equal(canonicalizeValue("37.8 g") === canonicalizeValue("37.8g"), true)
})
