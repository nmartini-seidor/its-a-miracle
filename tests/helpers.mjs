import { validateRunnerOutput } from "../lib/research-contract.ts"

// Drive a Research Job through the real lifecycle WITHOUT spawning CLIs: for each runner, feed a
// hand-written output.json through the real validator (the trust boundary) and ingest it via the
// store, exactly as the Worker does. `outputsByRunner` maps a runner id to either a raw
// output.json object, or null/undefined to simulate that runner failing.
export function simulateResearchJob(store, productId, outputsByRunner) {
  const job = store.createMockResearchRun(productId)
  const { runs } = store.getResearchJobWithRuns(job.id)
  const product = store.getStoredProduct(productId)
  const sequence = Number(job.id.split("-").pop()) || 1

  for (const run of runs) {
    const raw = outputsByRunner[run.runner]
    if (!raw) {
      store.recordRunnerRunResult(run.id, "FAILED", { error: "no output (simulated)" })
      continue
    }
    const validated = validateRunnerOutput(raw, {
      productId,
      runner: run.runner,
      sequence,
      baselineAttributes: product.baselineAttributes,
      now: "2026-06-23T12:00:00.000Z",
    })
    store.ingestRunnerOutput(run.id, { evidence: validated.evidence, candidates: validated.candidates })
  }
  // Ensure finalize ran even if the last processed run was a failure (idempotent).
  store.finalizeResearchJob(job.id)
  return { job: store.getResearchRun(job.id), runs: store.listRunnerRuns(job.id) }
}

// Convenience: build a valid output.json with one evidence per candidate.
export function buildOutput(entries) {
  const evidence = []
  const candidates = []
  entries.forEach(({ field, value, sourceType = "manufacturer_official", sourceUrl, snippet }, index) => {
    const id = `e${index + 1}`
    evidence.push({
      id,
      sourceType,
      sourceUrl: sourceUrl ?? `https://maker.example.com/${field}`,
      title: `${field} source`,
      snippet: snippet ?? `${field}: ${value}`,
    })
    candidates.push({ field, value, evidenceIds: [id] })
  })
  return { evidence, candidates }
}
