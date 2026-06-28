import type { ResearchRunnerId } from "../../lib/types.ts"
import {
  isRunnerLivenessUsable,
  WORKER_HEARTBEAT_MS,
  type RunnerLiveness,
  type WorkerPhase,
  type WorkerStatusRecord,
} from "../../lib/worker-status.ts"
import { detectRunnerAvailability, RESEARCH_RUNNERS } from "../research-runner/index.ts"
import { writeWorkerStatus } from "../store.ts"
import { processNextJob } from "./run.ts"

// The Worker (ADR 0001): a single long-lived local process that picks up QUEUED Research Jobs,
// spawns their subscription-CLI runners (jailed), validates the file-drops, and merges results.
// Sole executor of research; survives Next dev-server reloads because it is its own process.
// Run with `pnpm worker`.

const POLL_INTERVAL_MS = Number(process.env.RESEARCH_POLL_MS ?? 2_000)
const AVAILABILITY_REFRESH_MS = Number(process.env.RESEARCH_AVAILABILITY_REFRESH_MS ?? 300_000)

const log = (message: string) => console.log(`${new Date().toISOString()} ${message}`)

const shutdownController = new AbortController()
let shuttingDown = false
for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => {
    if (shuttingDown) process.exit(1)
    shuttingDown = true
    log(`received ${signal}, finishing in-flight run then exiting…`)
    shutdownController.abort()
  })
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

let availableRunnerIds = new Set<string>()
let lastAvailabilityCheck = 0

// --- Liveness heartbeat (ADR 0006) -------------------------------------------------------------
// The heartbeat is written by an INDEPENDENT timer, never the work loop: processNextJob awaits a
// whole job (up to ~10 min across three parallel runners with the repair-retry), so a loop-tied
// heartbeat would go stale during every legitimate long run and falsely report "Worker down".
// These module-level vars are the timer's view of what the loop is currently doing.
let workerPhase: WorkerPhase = "idle"
let currentJobId: string | null = null
let runnerLiveness: Partial<Record<ResearchRunnerId, RunnerLiveness>> = {}
let runnersCheckedAt: string | null = null

function buildStatus(phaseOverride?: WorkerPhase): WorkerStatusRecord {
  return {
    ts: new Date().toISOString(),
    pid: process.pid,
    phase: phaseOverride ?? workerPhase,
    currentJobId,
    runners: runnerLiveness,
    runnersCheckedAt,
  }
}

function emitHeartbeat(phaseOverride?: WorkerPhase) {
  try {
    writeWorkerStatus(buildStatus(phaseOverride))
  } catch (error) {
    log(`heartbeat write failed: ${error instanceof Error ? error.message : error}`)
  }
}

async function refreshAvailability() {
  const snapshot = await detectRunnerAvailability()
  runnerLiveness = Object.fromEntries(
    snapshot.map((availability) => [availability.runner, { installed: availability.installed, loggedIn: availability.loggedIn }]),
  ) as Partial<Record<ResearchRunnerId, RunnerLiveness>>
  runnersCheckedAt = new Date().toISOString()
  availableRunnerIds = new Set(snapshot.filter((availability) => isRunnerLivenessUsable(availability)).map((availability) => availability.runner))
  lastAvailabilityCheck = Date.now()
  const summary = RESEARCH_RUNNERS.map((runner) => `${runner.id}:${availableRunnerIds.has(runner.id) ? "✓" : "✗"}`).join("  ")
  log(`runner availability — ${summary}`)
  if (availableRunnerIds.size === 0) log("WARNING: no runners available (check CLI logins). Jobs will fail until a runner is reachable.")
  // Push the fresh runner snapshot into the heartbeat row immediately, not just on the next tick.
  emitHeartbeat()
}

async function main() {
  log("research worker starting")
  await refreshAvailability()
  // First heartbeat is written synchronously at startup, BEFORE the loop, so the UI sees "online"
  // the instant the Worker is up rather than after the first 5s tick.
  emitHeartbeat()
  const heartbeat = setInterval(() => emitHeartbeat(), WORKER_HEARTBEAT_MS)
  // unref() so this timer never keeps the process alive on its own during shutdown.
  heartbeat.unref()

  while (!shuttingDown) {
    if (Date.now() - lastAvailabilityCheck > AVAILABILITY_REFRESH_MS) await refreshAvailability()
    let didWork = false
    try {
      didWork = await processNextJob({
        availableRunnerIds,
        signal: shutdownController.signal,
        log,
        onClaim: (job) => {
          workerPhase = "busy"
          currentJobId = job.id
          emitHeartbeat()
        },
      })
    } catch (error) {
      log(`error processing job: ${error instanceof Error ? error.message : error}`)
    }
    // Back to idle once a job finished (or threw); the next claim flips us busy again.
    if (workerPhase !== "idle") {
      workerPhase = "idle"
      currentJobId = null
      emitHeartbeat()
    }
    if (!didWork && !shuttingDown) await sleep(POLL_INTERVAL_MS)
  }

  clearInterval(heartbeat)
  // Announce a clean shutdown so the UI shows "down" immediately instead of waiting out staleness.
  emitHeartbeat("stopping")
  log("research worker stopped")
  process.exit(0)
}

main().catch((error) => {
  log(`fatal: ${error instanceof Error ? error.stack : error}`)
  process.exit(1)
})
