import { getAvailableRunners, RESEARCH_RUNNERS } from "../research-runner/index.ts"
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

async function refreshAvailability() {
  const available = await getAvailableRunners()
  availableRunnerIds = new Set(available.map((runner) => runner.id))
  lastAvailabilityCheck = Date.now()
  const summary = RESEARCH_RUNNERS.map((runner) => `${runner.id}:${availableRunnerIds.has(runner.id) ? "✓" : "✗"}`).join("  ")
  log(`runner availability — ${summary}`)
  if (availableRunnerIds.size === 0) log("WARNING: no runners available (check CLI logins). Jobs will fail until a runner is reachable.")
}

async function main() {
  log("research worker starting")
  await refreshAvailability()

  while (!shuttingDown) {
    if (Date.now() - lastAvailabilityCheck > AVAILABILITY_REFRESH_MS) await refreshAvailability()
    let didWork = false
    try {
      didWork = await processNextJob({ availableRunnerIds, signal: shutdownController.signal, log })
    } catch (error) {
      log(`error processing job: ${error instanceof Error ? error.message : error}`)
    }
    if (!didWork && !shuttingDown) await sleep(POLL_INTERVAL_MS)
  }

  log("research worker stopped")
  process.exit(0)
}

main().catch((error) => {
  log(`fatal: ${error instanceof Error ? error.stack : error}`)
  process.exit(1)
})
