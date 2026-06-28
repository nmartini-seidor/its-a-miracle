import { RESEARCH_RUNNER_IDS } from "../../lib/research-contract.ts"
import type { ResearchRunnerId } from "../../lib/types.ts"
import { isRunnerLivenessUsable } from "../../lib/worker-status.ts"
import { claudeRunner } from "./claude.ts"
import { codexRunner } from "./codex.ts"
import { cursorRunner } from "./cursor.ts"
import type { RunnerAvailability, ResearchRunnerAdapter } from "./types.ts"

export { runRunner } from "./spawn.ts"
export type { RunnerContext, RunnerOutcome, RunnerAvailability, ResearchRunnerAdapter } from "./types.ts"

// The canonical runner-id list lives in lib/research-contract.ts (node-free, already imported by
// the store) so there is exactly one source of truth (ADR 0004 / hardening item 8). Re-export it
// here for the worker/runner layer rather than re-deriving it from the adapter pool.
export { RESEARCH_RUNNER_IDS }

// The runner pool a multi-runner Research Job fans out to (ADR 0004). Order is the display order.
export const RESEARCH_RUNNERS: ResearchRunnerAdapter[] = [cursorRunner, codexRunner, claudeRunner]

// Defense-in-depth: the adapter pool's ids must match the canonical contract list exactly (same
// ids, same order). Adding a 4th runner means editing RESEARCH_RUNNER_IDS once and registering its
// adapter here; any drift between the two throws at module load instead of failing silently later.
const adapterRunnerIds = RESEARCH_RUNNERS.map((runner) => runner.id)
if (
  adapterRunnerIds.length !== RESEARCH_RUNNER_IDS.length ||
  adapterRunnerIds.some((id, index) => id !== RESEARCH_RUNNER_IDS[index])
) {
  throw new Error(
    `RESEARCH_RUNNERS adapter ids [${adapterRunnerIds.join(", ")}] must match RESEARCH_RUNNER_IDS ` +
      `[${RESEARCH_RUNNER_IDS.join(", ")}] from lib/research-contract.ts`,
  )
}

export function getRunner(id: ResearchRunnerId): ResearchRunnerAdapter | null {
  return RESEARCH_RUNNERS.find((runner) => runner.id === id) ?? null
}

// Probe every runner CLI once (best-effort install + login detection). The full snapshot — both
// `installed` and `loggedIn` per runner — feeds the Worker heartbeat so the UI can name exactly
// which runners are reachable (ADR 0006).
export async function detectRunnerAvailability(): Promise<RunnerAvailability[]> {
  return Promise.all(RESEARCH_RUNNERS.map((runner) => runner.detectAvailability()))
}

// The multi-runner design degrades gracefully to fewer runners (ADR 0004): a Job runs whichever
// adapters are usable. A runner counts as usable only when installed AND not *known* logged-out —
// an installed-but-logged-out CLI (loggedIn === false) used to slip through here on `installed`
// alone and then fail at spawn time (ADR 0006 gotcha). loggedIn "unknown" stays optimistic.
export async function getAvailableRunners(): Promise<ResearchRunnerAdapter[]> {
  const snapshot = await detectRunnerAvailability()
  const usableIds = new Set(snapshot.filter((availability) => isRunnerLivenessUsable(availability)).map((availability) => availability.runner))
  return RESEARCH_RUNNERS.filter((runner) => usableIds.has(runner.id))
}
