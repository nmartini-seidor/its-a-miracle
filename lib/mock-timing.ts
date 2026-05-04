const secondsPattern = /^\d+(?:\.\d+)?$/

function readPositiveSeconds(value: string | undefined, fallbackSeconds: number) {
  if (!value || !secondsPattern.test(value)) return fallbackSeconds
  const seconds = Number(value)
  return Number.isFinite(seconds) && seconds > 0 ? seconds : fallbackSeconds
}

export const DEFAULT_MOCK_PRODUCT_IMPORT_SECONDS = 5
export const DEFAULT_MOCK_RESEARCH_AGENT_SECONDS = 5

export function getMockProductImportDurationMs() {
  return Math.round(readPositiveSeconds(process.env.NEXT_PUBLIC_MOCK_PRODUCT_IMPORT_SECONDS, DEFAULT_MOCK_PRODUCT_IMPORT_SECONDS) * 1000)
}

export function getMockResearchAgentDurationMs() {
  return Math.round(readPositiveSeconds(process.env.MOCK_RESEARCH_AGENT_SECONDS, DEFAULT_MOCK_RESEARCH_AGENT_SECONDS) * 1000)
}
