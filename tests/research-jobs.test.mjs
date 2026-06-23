import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { test } from "node:test"
import { buildOutput, simulateResearchJob } from "./helpers.mjs"

const store = await import("../server/store.ts")
const {
  addReviewDecision,
  createMockResearchRun,
  exportPreview,
  getStoredProduct,
  importDemoProducts,
  listRunnerRuns,
  resetDemoState,
  syncProductWithMirakl,
} = store

function seed() {
  resetDemoState()
  importDemoProducts()
}

test("creating a job queues one multi-runner Job and three QUEUED runner runs", () => {
  seed()
  const job = createMockResearchRun("galaxy-a55")
  assert.equal(job.status, "QUEUED")
  assert.equal(job.runner, "multi")
  assert.equal(getStoredProduct("galaxy-a55").listingStatus, "RESEARCH_IN_PROGRESS")

  const runs = listRunnerRuns(job.id)
  assert.deepEqual(runs.map((r) => r.runner).sort(), ["claude", "codex", "cursor"])
  assert.equal(runs.every((r) => r.status === "QUEUED"), true)

  // No fabricated data appears just from queuing.
  const product = getStoredProduct("galaxy-a55")
  assert.equal(product.candidates.length, 0)
  assert.equal(product.evidence.length, 0)
})

test("three runners agreeing on a value collapse to one high-confidence consensus candidate", () => {
  seed()
  const eanOut = buildOutput([{ field: "ean", value: "6942103169441", sourceType: "manufacturer_official" }])
  const { job } = simulateResearchJob(store, "galaxy-a55", { cursor: eanOut, codex: eanOut, claude: eanOut })

  assert.equal(job.status, "SUCCEEDED")
  const product = getStoredProduct("galaxy-a55")
  const eanCandidates = product.candidates.filter((c) => c.fieldName === "ean")
  assert.equal(eanCandidates.length, 1, "agreement collapses to a single candidate")
  assert.equal(eanCandidates[0].candidateValue, "6942103169441")
  assert.equal(eanCandidates[0].confidence, "high")
  assert.deepEqual([...eanCandidates[0].runners].sort(), ["claude", "codex", "cursor"])
  assert.equal(eanCandidates[0].sourceEvidenceIds.length > 0, true)
})

test("runners disagreeing on a value produce competing candidates flagged for review", () => {
  seed()
  const { job } = simulateResearchJob(store, "galaxy-a55", {
    cursor: buildOutput([{ field: "batteryCapacity", value: "5000 mAh" }]),
    claude: buildOutput([{ field: "batteryCapacity", value: "5000 mAh" }]),
    codex: buildOutput([{ field: "batteryCapacity", value: "4900 mAh" }]),
  })
  assert.equal(job.status, "SUCCEEDED")
  const product = getStoredProduct("galaxy-a55")
  const battery = product.candidates.filter((c) => c.fieldName === "batteryCapacity")
  assert.equal(battery.length, 2, "disagreement yields competing candidates")
  const agreeing = battery.find((c) => c.candidateValue === "5000 mAh")
  const dissenting = battery.find((c) => c.candidateValue === "4900 mAh")
  assert.deepEqual([...agreeing.runners].sort(), ["claude", "cursor"])
  assert.deepEqual(dissenting.runners, ["codex"])
})

test("a runner that only finds forum/evidence-less data contributes nothing (no fabrication)", () => {
  seed()
  const { job } = simulateResearchJob(store, "galaxy-a55", {
    cursor: {
      evidence: [{ id: "f1", sourceType: "forum_social", sourceUrl: "https://reddit.com/r/x", title: "t", snippet: "rumor" }],
      candidates: [{ field: "ean", value: "0000000000000", evidenceIds: ["f1"] }],
    },
    codex: buildOutput([{ field: "ean", value: "6942103169441" }]),
    claude: null, // simulated failure
  })
  assert.equal(job.status, "SUCCEEDED")
  const product = getStoredProduct("galaxy-a55")
  const ean = product.candidates.filter((c) => c.fieldName === "ean")
  assert.equal(ean.length, 1)
  assert.equal(ean[0].candidateValue, "6942103169441") // forum value never made it in
  assert.deepEqual(ean[0].runners, ["codex"])
})

test("a partial-failure job still succeeds on the surviving runners", () => {
  seed()
  const { job, runs } = simulateResearchJob(store, "galaxy-a55", {
    cursor: buildOutput([{ field: "cameraResolution", value: "50 MP" }]),
    codex: null,
    claude: null,
  })
  assert.equal(job.status, "SUCCEEDED")
  assert.equal(runs.filter((r) => r.status === "FAILED").length, 2)
  assert.equal(getStoredProduct("galaxy-a55").candidates.some((c) => c.fieldName === "cameraResolution"), true)
})

test("a job where every runner fails ends FAILED with no candidates", () => {
  seed()
  const { job } = simulateResearchJob(store, "galaxy-a55", { cursor: null, codex: null, claude: null })
  assert.equal(job.status, "FAILED")
  assert.equal(getStoredProduct("galaxy-a55").candidates.length, 0)
})

test("re-running research replaces proposed candidates per field without duplicating", () => {
  seed()
  simulateResearchJob(store, "galaxy-a55", {
    cursor: buildOutput([{ field: "ean", value: "6942103169441" }]),
    codex: buildOutput([{ field: "ean", value: "6942103169441" }]),
    claude: buildOutput([{ field: "ean", value: "6942103169441" }]),
  })
  simulateResearchJob(store, "galaxy-a55", {
    cursor: buildOutput([{ field: "ean", value: "6942103169441" }]),
    codex: buildOutput([{ field: "ean", value: "6942103169441" }]),
    claude: buildOutput([{ field: "ean", value: "6942103169441" }]),
  })
  const product = getStoredProduct("galaxy-a55")
  assert.equal(product.candidates.filter((c) => c.fieldName === "ean").length, 1)
})

test("accepting a candidate makes the product export-ready and appears in the export preview", () => {
  seed()
  simulateResearchJob(store, "galaxy-a55", {
    cursor: buildOutput([{ field: "batteryCapacity", value: "5000 mAh" }]),
    codex: buildOutput([{ field: "batteryCapacity", value: "5000 mAh" }]),
    claude: buildOutput([{ field: "batteryCapacity", value: "5000 mAh" }]),
  })
  const product = getStoredProduct("galaxy-a55")
  const candidate = product.candidates.find((c) => c.fieldName === "batteryCapacity")
  addReviewDecision(candidate.id, "APPROVE", "verified")
  const after = getStoredProduct("galaxy-a55")
  assert.equal(after.listingStatus, "EXPORT_READY")
  const preview = exportPreview("galaxy-a55")
  assert.equal(preview.rows.some((row) => row.field === "batteryCapacity" && row.value === "5000 mAh"), true)
})

test("approving a candidate then syncing writes it to the baseline and lifts the score", () => {
  seed()
  const initialScore = getStoredProduct("galaxy-a55").qualityScore
  simulateResearchJob(store, "galaxy-a55", {
    cursor: buildOutput([{ field: "cameraResolution", value: "50 MP" }]),
    codex: buildOutput([{ field: "cameraResolution", value: "50 MP" }]),
    claude: buildOutput([{ field: "cameraResolution", value: "50 MP" }]),
  })
  const candidate = getStoredProduct("galaxy-a55").candidates.find((c) => c.fieldName === "cameraResolution")
  addReviewDecision(candidate.id, "APPROVE", "verified")
  const result = syncProductWithMirakl("galaxy-a55")
  const synced = getStoredProduct("galaxy-a55")
  assert.equal(result.syncedFields.includes("cameraResolution"), true)
  assert.equal(synced.baselineAttributes.cameraResolution, "50 MP")
  assert.equal(synced.qualityScore > initialScore, true)
})

test("retailer-only consensus is capped below high even when all runners agree", () => {
  seed()
  const retailerOut = buildOutput([
    { field: "ean", value: "6942103169441", sourceType: "retailer", sourceUrl: "https://www.mediamarkt.es/p" },
  ])
  simulateResearchJob(store, "galaxy-a55", { cursor: retailerOut, codex: retailerOut, claude: retailerOut })
  const ean = getStoredProduct("galaxy-a55").candidates.find((c) => c.fieldName === "ean")
  assert.equal(ean.confidence === "high", false)
})

// --- component / page wiring (unchanged by the real-research migration) ---

test("product detail research action is presented as an agent run", () => {
  const source = readFileSync("components/product/research-button.tsx", "utf8")
  assert.equal(source.includes("BotIcon"), true)
  assert.equal(source.includes("RefreshCwIcon"), true)
  assert.equal(source.includes("animate-spin"), true)
  assert.equal(source.includes("Run Research Agent"), true)
  assert.equal(source.includes("rounded-xl bg-gradient-to-r from-fuchsia-500 via-violet-500 to-sky-400"), true)
  assert.equal(source.includes("beginResearchActivity"), true)
  assert.equal(source.includes("research-flight-orb"), true)
})

test("research workspace page and navigation animation are wired", () => {
  const pageSource = readFileSync("app/research/page.tsx", "utf8")
  const topNavSource = readFileSync("components/app/top-nav.tsx", "utf8")
  const activitySource = readFileSync("components/app/research-activity.ts", "utf8")
  const globalsSource = readFileSync("app/globals.css", "utf8")
  assert.equal(pageSource.includes("Research agent queue"), true)
  assert.equal(pageSource.includes("listResearchJobs"), true)
  assert.equal(topNavSource.includes("useResearchActivity"), true)
  assert.equal(topNavSource.includes("research-nav-active"), true)
  assert.equal(activitySource.includes("mirakl-research-active-count"), true)
  assert.equal(globalsSource.includes("research-star-flight"), true)
})
