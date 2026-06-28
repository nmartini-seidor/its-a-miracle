const secondsPattern = /^\d+(?:\.\d+)?$/

function readPositiveSeconds(value: string | undefined, fallbackSeconds: number) {
  if (!value || !secondsPattern.test(value)) return fallbackSeconds
  const seconds = Number(value)
  return Number.isFinite(seconds) && seconds > 0 ? seconds : fallbackSeconds
}

export const DEFAULT_MOCK_PRODUCT_IMPORT_SECONDS = 5

// Paces the branded import-progress animation only (item 6). The import itself is sub-second and
// atomic — this is presentation timing, not a real fetch duration. Tuned by
// NEXT_PUBLIC_MOCK_PRODUCT_IMPORT_SECONDS. (The former getMockResearchAgentDurationMs /
// MOCK_RESEARCH_AGENT_SECONDS was a dead simulated-research knob with no consumers — removed in the
// ADR-0006 worker-liveness work; real research timing is env-controlled in the Worker.)
export function getMockProductImportDurationMs() {
  return Math.round(readPositiveSeconds(process.env.NEXT_PUBLIC_MOCK_PRODUCT_IMPORT_SECONDS, DEFAULT_MOCK_PRODUCT_IMPORT_SECONDS) * 1000)
}
