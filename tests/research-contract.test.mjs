import assert from "node:assert/strict"
import { test } from "node:test"

const {
  RESEARCH_CONTRACT_VERSION,
  OUTPUT_JSON_SCHEMA,
  SOURCE_TYPES,
  buildMission,
  validateRunnerOutput,
  shouldRepairRetry,
} = await import("../lib/research-contract.ts")

const baseCtx = { productId: "freeclip-2", runner: "claude", sequence: 1, now: "2026-06-23T00:00:00.000Z" }

function ev(id, sourceType, extra = {}) {
  return { id, sourceType, sourceUrl: `https://example.com/${id}`, title: `t-${id}`, snippet: `snippet for ${id}`, ...extra }
}

test("mission embeds the generated JSON schema and lists missing fields", () => {
  const product = {
    id: "freeclip-2",
    miraklProductId: "MIRAKL_3711247",
    title: "Huawei FreeClip 2",
    brand: null,
    categoryPath: ["Audio", "Headphones & Earbuds"],
    baselineDescription: "",
    baselineAttributes: { ean: null, bluetoothVersion: "Bluetooth 5.0" },
  }
  const schema = { requiredAttributes: ["brand", "ean"], recommendedAttributes: ["bluetoothVersion", "weight"] }
  const mission = buildMission(product, schema, "claude")

  assert.equal(mission.missionVersion, RESEARCH_CONTRACT_VERSION)
  assert.equal(mission.runner, "claude")
  assert.deepEqual(mission.allowedSourceTiers, ["A", "B", "C"])
  assert.equal(mission.outputSchema === OUTPUT_JSON_SCHEMA, true)
  // brand + ean + weight are missing; bluetoothVersion has a baseline value.
  const missingFields = mission.schemaGaps.missing.map((m) => m.field)
  assert.deepEqual(missingFields.sort(), ["brand", "ean", "weight"])
  assert.equal(mission.instructions.includes("MUST actually browse the web"), true)
  assert.equal(mission.instructions.includes("tier D"), true)
})

test("generated JSON schema enumerates allowed source types and field ids", () => {
  const json = JSON.stringify(OUTPUT_JSON_SCHEMA)
  for (const sourceType of SOURCE_TYPES) assert.equal(json.includes(sourceType), true)
  assert.equal(json.includes("manufacturer_official"), true)
  assert.equal(json.includes("evidenceIds"), true)
})

test("valid output yields evidence + candidates with our own ids and proposed status", () => {
  const raw = {
    product: "Huawei FreeClip 2",
    evidence: [ev("e1", "manufacturer_official"), ev("e2", "retailer")],
    candidates: [
      { field: "bluetoothVersion", value: "Bluetooth 6.0", evidenceIds: ["e1"] },
      { field: "ean", value: "6942103169441", evidenceIds: ["e2"] },
    ],
  }
  const result = validateRunnerOutput(raw, { ...baseCtx, baselineAttributes: { bluetoothVersion: "Bluetooth 5.0", ean: null } })
  assert.equal(result.structurallyValid, true)
  assert.equal(result.candidates.length, 2)
  assert.equal(result.candidates.every((c) => c.status === "proposed"), true)
  assert.equal(result.candidates.every((c) => c.id.startsWith("cand-claude-freeclip-2-")), true)
  assert.equal(result.candidates.every((c) => c.sourceEvidenceIds.length > 0), true)
  assert.equal(result.candidates.every((c) => c.runner === "claude"), true)
  const bt = result.candidates.find((c) => c.fieldName === "bluetoothVersion")
  assert.equal(bt.currentValue, "Bluetooth 5.0")
  assert.equal(bt.candidateValue, "Bluetooth 6.0")
})

test("manufacturer-backed candidate is high; retailer-only candidate is capped at medium", () => {
  const raw = {
    evidence: [ev("m1", "manufacturer_official"), ev("r1", "retailer"), ev("mk1", "marketplace")],
    candidates: [
      { field: "weight", value: "37.8 g", evidenceIds: ["m1"] },
      { field: "ean", value: "111", evidenceIds: ["r1"] },
      { field: "color", value: "x", evidenceIds: ["mk1"] }, // 'color' is not a field id -> dropped
    ],
  }
  const result = validateRunnerOutput(raw, baseCtx)
  const weight = result.candidates.find((c) => c.fieldName === "weight")
  const ean = result.candidates.find((c) => c.fieldName === "ean")
  assert.equal(weight.confidence, "high")
  assert.equal(ean.confidence, "medium") // retailer-only is capped, never high
})

test("D-tier evidence is hard-rejected and a candidate citing only D-tier is dropped", () => {
  const raw = {
    evidence: [ev("f1", "forum_social"), ev("u1", "unattributed")],
    candidates: [{ field: "ean", value: "6942103169441", evidenceIds: ["f1", "u1"] }],
  }
  const result = validateRunnerOutput(raw, baseCtx)
  assert.equal(result.evidence.length, 0)
  assert.equal(result.candidates.length, 0)
  assert.equal(result.diagnostics.droppedCandidates.some((d) => d.reason === "no_surviving_evidence"), true)
  assert.equal(result.diagnostics.droppedEvidence.length, 2)
})

test("unknown source type is treated as untrusted and rejected", () => {
  const raw = {
    evidence: [ev("x1", "totally_made_up_source")],
    candidates: [{ field: "ean", value: "123", evidenceIds: ["x1"] }],
  }
  const result = validateRunnerOutput(raw, baseCtx)
  assert.equal(result.candidates.length, 0)
  assert.equal(result.evidence.length, 0)
})

test("evidence-less candidate is dropped", () => {
  const raw = {
    evidence: [ev("e1", "manufacturer_official")],
    candidates: [{ field: "weight", value: "37.8 g", evidenceIds: ["does-not-exist"] }],
  }
  const result = validateRunnerOutput(raw, baseCtx)
  assert.equal(result.candidates.length, 0)
  assert.equal(result.diagnostics.droppedCandidates.some((d) => d.reason === "no_surviving_evidence"), true)
})

test("a self-reported confidence on the agent payload is ignored, not trusted", () => {
  const raw = {
    evidence: [ev("r1", "retailer")],
    candidates: [{ field: "ean", value: "123", evidenceIds: ["r1"], confidence: "high" }],
  }
  const result = validateRunnerOutput(raw, baseCtx)
  // Retailer-only stays medium regardless of what the agent claimed.
  assert.equal(result.candidates[0].confidence, "medium")
})

test("one malformed candidate does not nuke the other valid candidates", () => {
  const raw = {
    evidence: [ev("e1", "manufacturer_official")],
    candidates: [
      { field: "weight", value: "37.8 g", evidenceIds: ["e1"] },
      { value: "no field here", evidenceIds: ["e1"] }, // malformed: missing field
    ],
  }
  const result = validateRunnerOutput(raw, baseCtx)
  assert.equal(result.structurallyValid, true)
  assert.equal(result.candidates.length, 1)
  assert.equal(result.candidates[0].fieldName, "weight")
})

test("broken top-level shape is flagged structurally invalid", () => {
  const result = validateRunnerOutput("not even json-ish", baseCtx)
  assert.equal(result.structurallyValid, false)
  assert.equal(result.diagnostics.structuralErrors.length > 0, true)
})

test("cited evidence carries the extracted field value for the comparison view", () => {
  const raw = {
    evidence: [ev("e1", "manufacturer_official")],
    candidates: [{ field: "weight", value: "37.8 g", evidenceIds: ["e1"] }],
  }
  const result = validateRunnerOutput(raw, baseCtx)
  assert.equal(result.evidence.length, 1)
  assert.equal(result.evidence[0].extractedFields.weight, "37.8 g")
  assert.equal(result.evidence[0].sourceTier, "A")
  assert.equal(result.evidence[0].runner, "claude")
})

// --- adversarial hardening (locks in the red-team fixes) ---

test("source-label spoofing is capped by hostname: a marketplace page labeled manufacturer is not high", () => {
  const raw = {
    evidence: [{ id: "e1", sourceType: "manufacturer_official", sourceUrl: "https://www.amazon.com/dp/B0CXYZ", title: "t", snippet: "EAN 6942103169441" }],
    candidates: [{ field: "ean", value: "6942103169441", evidenceIds: ["e1"] }],
  }
  const result = validateRunnerOutput(raw, baseCtx)
  assert.equal(result.candidates.length, 1)
  assert.notEqual(result.candidates[0].confidence, "high") // amazon host -> marketplace, capped
  assert.equal(result.evidence[0].sourceTier, "C")
})

test("a forum host labeled manufacturer_official is hard-rejected", () => {
  const raw = {
    evidence: [{ id: "e1", sourceType: "manufacturer_official", sourceUrl: "https://www.reddit.com/r/headphones/comments/abc", title: "t", snippet: "someone says BT 6.0" }],
    candidates: [{ field: "bluetoothVersion", value: "Bluetooth 6.0", evidenceIds: ["e1"] }],
  }
  const result = validateRunnerOutput(raw, baseCtx)
  assert.equal(result.evidence.length, 0)
  assert.equal(result.candidates.length, 0)
})

test("generic commerce host (shop/store) labeled manufacturer is capped at retailer", () => {
  const raw = {
    evidence: [{ id: "e1", sourceType: "manufacturer_official", sourceUrl: "https://thirdparty-shop.example/p", title: "t", snippet: "spec" }],
    candidates: [{ field: "weight", value: "37.8 g", evidenceIds: ["e1"] }],
  }
  const result = validateRunnerOutput(raw, baseCtx)
  assert.equal(result.candidates[0].confidence === "high", false)
})

test("mirakl and operator_document are no longer agent-claimable source types (rejected)", () => {
  for (const sourceType of ["mirakl", "operator_document"]) {
    const raw = {
      evidence: [{ id: "e1", sourceType, sourceUrl: "https://random.example/x", title: "t", snippet: "s" }],
      candidates: [{ field: "ean", value: "1", evidenceIds: ["e1"] }],
    }
    const result = validateRunnerOutput(raw, baseCtx)
    assert.equal(result.candidates.length, 0, `${sourceType} should be rejected`)
  }
})

test("duplicate evidence citations are deduped (no forged multi-source corroboration)", () => {
  const raw = {
    evidence: [{ id: "r1", sourceType: "retailer", sourceUrl: "https://unknown-retailer.example/p", title: "t", snippet: "s" }],
    candidates: [{ field: "ean", value: "1234567890123", evidenceIds: ["r1", "r1", "r1"] }],
  }
  const result = validateRunnerOutput(raw, baseCtx)
  assert.equal(result.candidates[0].sourceEvidenceIds.length, 1)
})

test("a credentials/data URI trick is rejected as a non-URL", () => {
  const raw = {
    evidence: [{ id: "e1", sourceType: "manufacturer_official", sourceUrl: "https://a@data:text/html,<script>x</script>", title: "t", snippet: "s" }],
    candidates: [{ field: "description", value: "x", evidenceIds: ["e1"] }],
  }
  const result = validateRunnerOutput(raw, baseCtx)
  assert.equal(result.evidence.length, 0)
  assert.equal(result.candidates.length, 0)
})

test("html and over-long values are sanitized", () => {
  const raw = {
    evidence: [{ id: "e1", sourceType: "manufacturer_official", sourceUrl: "https://maker.example.com/p", title: "t", snippet: "s" }],
    candidates: [
      { field: "description", value: `<b>Great</b> product. ${"x".repeat(5000)}`, evidenceIds: ["e1"] },
      { field: "weight", value: "  37.8 g  ", evidenceIds: ["e1"] },
    ],
  }
  const result = validateRunnerOutput(raw, baseCtx)
  const desc = result.candidates.find((c) => c.fieldName === "description")
  const weight = result.candidates.find((c) => c.fieldName === "weight")
  assert.equal(desc.candidateValue.includes("<b>"), false)
  assert.equal(desc.candidateValue.length <= 2000, true)
  assert.equal(weight.candidateValue, "37.8 g")
})

test("shouldRepairRetry triggers on structural failure but not on legitimate policy drops", () => {
  const broken = validateRunnerOutput("garbage", baseCtx)
  assert.equal(shouldRepairRetry(broken, true), true)

  // All candidates dropped purely by policy (D-tier) — legitimate, no retry.
  const policyOnly = validateRunnerOutput(
    { evidence: [ev("f1", "forum_social")], candidates: [{ field: "ean", value: "1", evidenceIds: ["f1"] }] },
    baseCtx,
  )
  assert.equal(shouldRepairRetry(policyOnly, true), false)

  // A candidate thrown out for a schema reason with nothing surviving -> retry.
  const schemaDrop = validateRunnerOutput({ evidence: [], candidates: [{ value: "x", evidenceIds: ["e1"] }] }, baseCtx)
  assert.equal(shouldRepairRetry(schemaDrop, true), true)
})
