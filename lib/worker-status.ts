import type { ResearchRunnerId } from "./types.ts"

// Worker liveness + the operator-facing "why isn't research progressing?" taxonomy (ADR 0006).
// The Worker (`pnpm worker`) publishes a heartbeat to the `workerStatus` kv row every
// WORKER_HEARTBEAT_MS; the Next server derives liveness from how stale that row is. Kept here as a
// node-free, dependency-light module so both the store (deriving state) and tests can use it.

// Heartbeat cadence written by the Worker's independent timer (never the work loop).
export const WORKER_HEARTBEAT_MS = 5_000
// A row older than this is "down". 4× the cadence absorbs a missed tick / GC pause / short macOS
// nap; it is tied to the heartbeat cadence, NOT to how long a research job takes.
export const WORKER_STALE_MS = 20_000

export type WorkerPhase = "idle" | "busy" | "stopping"

// What the Worker last observed about one runner CLI. `loggedIn: "unknown"` means the probe could
// not determine auth state (best-effort) — treated optimistically as usable; a definite `false`
// (installed but logged out) is NOT usable because it fails at spawn time.
export type RunnerLiveness = { installed: boolean; loggedIn: boolean | "unknown" }

// The heartbeat row the Worker upserts into kv["workerStatus"].
export type WorkerStatusRecord = {
  ts: string
  pid: number
  phase: WorkerPhase
  currentJobId: string | null
  runners: Partial<Record<ResearchRunnerId, RunnerLiveness>>
  runnersCheckedAt: string | null
}

// online = fresh heartbeat; down = stale/stopping row; unknown = no row yet (Worker never ran
// against this database).
export type WorkerLivenessState = "online" | "down" | "unknown"

export type WorkerSnapshot = {
  state: WorkerLivenessState
  phase: WorkerPhase | null
  // Milliseconds since the last heartbeat, or null when there is no row.
  lastSeenMs: number | null
  currentJobId: string | null
  pid: number | null
  runners: Partial<Record<ResearchRunnerId, RunnerLiveness>> | null
  runnersCheckedAt: string | null
  // Runners the Worker could actually spawn right now (installed AND not known-logged-out).
  availableRunnerCount: number
}

// A runner is usable when it is installed and not *definitely* logged out. "unknown" stays usable.
export function isRunnerLivenessUsable(liveness: RunnerLiveness | null | undefined): boolean {
  return Boolean(liveness) && liveness!.installed && liveness!.loggedIn !== false
}

export function countUsableRunners(
  runners: Partial<Record<ResearchRunnerId, RunnerLiveness>> | null | undefined,
): number {
  if (!runners) return 0
  return Object.values(runners).filter((liveness) => isRunnerLivenessUsable(liveness)).length
}

export function deriveWorkerSnapshot(row: WorkerStatusRecord | null, nowMs: number): WorkerSnapshot {
  if (!row) {
    return {
      state: "unknown",
      phase: null,
      lastSeenMs: null,
      currentJobId: null,
      pid: null,
      runners: null,
      runnersCheckedAt: null,
      availableRunnerCount: 0,
    }
  }
  const lastSeenMs = nowMs - new Date(row.ts).getTime()
  // A clean shutdown writes phase:"stopping"; treat it as down immediately rather than waiting out
  // the staleness window. An unparseable/future ts (NaN/negative) falls through to "down" safely.
  const fresh = Number.isFinite(lastSeenMs) && lastSeenMs >= 0 && lastSeenMs < WORKER_STALE_MS
  const state: WorkerLivenessState = row.phase === "stopping" ? "down" : fresh ? "online" : "down"
  return {
    state,
    phase: row.phase,
    lastSeenMs: Number.isFinite(lastSeenMs) ? lastSeenMs : null,
    currentJobId: row.currentJobId,
    pid: row.pid,
    runners: row.runners,
    runnersCheckedAt: row.runnersCheckedAt,
    availableRunnerCount: countUsableRunners(row.runners),
  }
}
