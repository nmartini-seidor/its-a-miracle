import type { ResearchRunnerId } from "../../lib/types.ts"
import { claudeRunner } from "./claude.ts"
import { codexRunner } from "./codex.ts"
import { cursorRunner } from "./cursor.ts"
import type { ResearchRunnerAdapter } from "./types.ts"

export { runRunner } from "./spawn.ts"
export type { RunnerContext, RunnerOutcome, RunnerAvailability, ResearchRunnerAdapter } from "./types.ts"

// The runner pool a multi-runner Research Job fans out to (ADR 0004). Order is the display order.
export const RESEARCH_RUNNERS: ResearchRunnerAdapter[] = [cursorRunner, codexRunner, claudeRunner]

export const RESEARCH_RUNNER_IDS: ResearchRunnerId[] = RESEARCH_RUNNERS.map((runner) => runner.id)

export function getRunner(id: ResearchRunnerId): ResearchRunnerAdapter | null {
  return RESEARCH_RUNNERS.find((runner) => runner.id === id) ?? null
}

// The multi-runner design degrades gracefully to fewer runners (ADR 0004): a Job runs whichever
// adapters report installed; an unavailable runner is skipped, not faked.
export async function getAvailableRunners(): Promise<ResearchRunnerAdapter[]> {
  const checks = await Promise.all(
    RESEARCH_RUNNERS.map(async (runner) => ({ runner, availability: await runner.detectAvailability() })),
  )
  return checks.filter((entry) => entry.availability.installed).map((entry) => entry.runner)
}
