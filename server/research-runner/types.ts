import type { ResearchRunnerId } from "../../lib/types.ts"

// A ResearchRunner adapter (ADR 0001/0004) executes one Runner Run by spawning a single
// subscription-authed agent CLI headlessly in a jailed working dir. The adapter only knows how
// to *invoke* its CLI; the shared spawn harness owns jailing, teeing, timeout and cancellation,
// and the worker owns validation/ingestion. The agent's only trusted output is output.json.

export type RunnerContext = {
  // Per-run working directory (the jail). The runner's cwd; it writes output.json here.
  jailDir: string
  // Absolute path to mission.json written into the jail.
  missionPath: string
  // The instruction prompt handed to the CLI.
  prompt: string
  timeoutMs: number
  // Aborting this signal cancels the run (worker-driven cancel / shutdown).
  signal: AbortSignal
  // Receives each stdout/stderr line (also teed to log.ndjson by the harness).
  onLog?: (line: string) => void
}

export type RunnerTerminalStatus = "SUCCEEDED" | "FAILED" | "TIMEOUT" | "CANCELLED"

export type RunnerOutcome = {
  status: RunnerTerminalStatus
  exitCode: number | null
  timedOut: boolean
  cancelled: boolean
  durationMs: number
  // Whether output.json exists in the jail after the process exits.
  outputExists: boolean
  errorMessage?: string
}

export type RunnerAvailability = {
  runner: ResearchRunnerId
  installed: boolean
  loggedIn: boolean | "unknown"
  detail: string
}

export type RunnerInvocation = {
  command: string
  args: string[]
  // When set, the prompt is fed via stdin instead of as an argv element (claude needs this —
  // its --allowedTools is variadic and would otherwise swallow a positional prompt).
  stdin?: string
}

export interface ResearchRunnerAdapter {
  id: ResearchRunnerId
  displayName: string
  // Build the argv for one run. The harness sets cwd = ctx.jailDir and strips API keys.
  buildInvocation(ctx: RunnerContext): RunnerInvocation
  // Best-effort check that the CLI is installed and authenticated under a subscription login.
  detectAvailability(): Promise<RunnerAvailability>
}
