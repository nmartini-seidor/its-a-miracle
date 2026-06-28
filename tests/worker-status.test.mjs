import assert from "node:assert/strict"
import { test } from "node:test"

const { deriveWorkerSnapshot, countUsableRunners, isRunnerLivenessUsable, WORKER_STALE_MS } = await import("../lib/worker-status.ts")
const {
  createResearchJob,
  getWorkerSnapshot,
  importDemoProducts,
  resetDemoState,
  updateStoredSettings,
  writeWorkerStatus,
} = await import("../server/store.ts")

const runnersAllReady = {
  cursor: { installed: true, loggedIn: true },
  codex: { installed: true, loggedIn: "unknown" },
  claude: { installed: true, loggedIn: true },
}

test("runner usability excludes the known-logged-out CLI but keeps unknown", () => {
  assert.equal(isRunnerLivenessUsable({ installed: true, loggedIn: true }), true)
  assert.equal(isRunnerLivenessUsable({ installed: true, loggedIn: "unknown" }), true)
  assert.equal(isRunnerLivenessUsable({ installed: true, loggedIn: false }), false)
  assert.equal(isRunnerLivenessUsable({ installed: false, loggedIn: true }), false)
  assert.equal(countUsableRunners({ cursor: { installed: true, loggedIn: true }, codex: { installed: true, loggedIn: false }, claude: { installed: false, loggedIn: false } }), 1)
})

test("deriveWorkerSnapshot: no row is unknown, fresh is online, stale and stopping are down", () => {
  assert.equal(deriveWorkerSnapshot(null, 1_000).state, "unknown")

  const ts = new Date(1_000_000).toISOString()
  const fresh = deriveWorkerSnapshot({ ts, pid: 1, phase: "idle", currentJobId: null, runners: runnersAllReady, runnersCheckedAt: ts }, 1_000_000 + 1_000)
  assert.equal(fresh.state, "online")
  assert.equal(fresh.availableRunnerCount, 3)

  const stale = deriveWorkerSnapshot({ ts, pid: 1, phase: "idle", currentJobId: null, runners: runnersAllReady, runnersCheckedAt: ts }, 1_000_000 + WORKER_STALE_MS + 1)
  assert.equal(stale.state, "down")

  // A clean shutdown writes phase:"stopping" — down immediately even with a fresh ts.
  const stopping = deriveWorkerSnapshot({ ts, pid: 1, phase: "stopping", currentJobId: null, runners: runnersAllReady, runnersCheckedAt: ts }, 1_000_000 + 1_000)
  assert.equal(stopping.state, "down")
})

test("getWorkerSnapshot round-trips a heartbeat row: fresh online, stale down, none unknown", () => {
  resetDemoState()
  writeWorkerStatus({ ts: new Date().toISOString(), pid: 4242, phase: "busy", currentJobId: "research-x-1", runners: runnersAllReady, runnersCheckedAt: new Date().toISOString() })
  const online = getWorkerSnapshot()
  assert.equal(online.state, "online")
  assert.equal(online.phase, "busy")
  assert.equal(online.currentJobId, "research-x-1")
  assert.equal(online.availableRunnerCount, 3)

  writeWorkerStatus({ ts: new Date(Date.now() - 60_000).toISOString(), pid: 4242, phase: "idle", currentJobId: null, runners: runnersAllReady, runnersCheckedAt: new Date().toISOString() })
  assert.equal(getWorkerSnapshot().state, "down")
})

test("createResearchJob: paused intake refuses new jobs but lets an in-flight one drain", () => {
  resetDemoState()
  importDemoProducts()

  // Missing product is its own discriminated reason, distinct from paused.
  assert.deepEqual(createResearchJob("does-not-exist"), { ok: false, reason: "product_not_found" })

  // Paused: a brand-new product gets no job.
  updateStoredSettings({ fakeResearchMode: false })
  const paused = createResearchJob("galaxy-a55")
  assert.equal(paused.ok, false)
  assert.equal(paused.reason, "paused")

  // Enabled: a fresh job is queued.
  updateStoredSettings({ fakeResearchMode: true })
  const created = createResearchJob("galaxy-a55")
  assert.equal(created.ok, true)
  assert.equal(created.reused, false)
  const jobId = created.job.id

  // Re-pausing must NOT kill the in-flight job: dedupe returns it (it drains) rather than 'paused'.
  updateStoredSettings({ fakeResearchMode: false })
  const drained = createResearchJob("galaxy-a55")
  assert.equal(drained.ok, true)
  assert.equal(drained.reused, true)
  assert.equal(drained.job.id, jobId)

  updateStoredSettings({ fakeResearchMode: true })
})
