import assert from "node:assert/strict"
import { test } from "node:test"

const { getCompetingCandidatesByField, isFieldConflicted } = await import("../lib/product-review.ts")

function cand(field, value, status = "proposed", confidence = "medium") {
  return { id: `${field}-${value}`, productId: "p1", fieldName: field, currentValue: null, candidateValue: value, sourceEvidenceIds: ["e"], confidence, status }
}

function product(candidates) {
  return {
    id: "p1",
    miraklProductId: "M1",
    title: "t",
    brand: null,
    categoryPath: [],
    schemaId: "schema-smartphones",
    listingStatus: "READY_FOR_REVIEW",
    qualityScore: 0,
    scoreBand: "red",
    baselineDescription: "",
    warnings: [],
    baselineAttributes: {},
    bestEvidenceByField: {},
    evidence: [],
    candidates,
  }
}

test("competing candidates for a field are grouped and a conflict is detected", () => {
  const byField = getCompetingCandidatesByField(product([cand("weight", "37.8 g"), cand("weight", "38 g"), cand("ean", "111")]))
  assert.equal(byField.get("weight").length, 2)
  assert.equal(byField.get("ean").length, 1)
  assert.equal(isFieldConflicted(byField.get("weight")), true)
  assert.equal(isFieldConflicted(byField.get("ean")), false)
})

test("rejected candidates are excluded; accepted sorts first", () => {
  const byField = getCompetingCandidatesByField(
    product([cand("weight", "old", "rejected"), cand("weight", "37.8 g", "accepted"), cand("weight", "38 g", "proposed")]),
  )
  const weight = byField.get("weight")
  assert.equal(weight.length, 2) // rejected dropped
  assert.equal(weight[0].status, "accepted") // accepted leads
})
