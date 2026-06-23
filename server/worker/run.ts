import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import path from "node:path"
import { buildMission, shouldRepairRetry, validateRunnerOutput } from "../../lib/research-contract.ts"
import type { CandidateRecord, EvidenceRecord } from "../../lib/types.ts"
import { getProduct, getSchemaById } from "../data.ts"
import { getRunner } from "../research-runner/index.ts"
import { runRunner } from "../research-runner/spawn.ts"
import type { ResearchRunnerAdapter } from "../research-runner/types.ts"
import {
  claimNextResearchJob,
  finalizeResearchJob,
  markRunnerRunStarted,
  recordRunnerRunResult,
} from "../store.ts"

export const RUNS_DIR = path.join(process.cwd(), "data", "research", "runs")
const RUN_TIMEOUT_MS = Number(process.env.RESEARCH_RUN_TIMEOUT_MS ?? 300_000)

export type WorkerLogger = (message: string) => void
const noopLog: WorkerLogger = () => {}

type StoreJob = NonNullable<ReturnType<typeof claimNextResearchJob>>["job"]
type StoreRun = NonNullable<ReturnType<typeof claimNextResearchJob>>["runs"][number]

function jobSequence(jobId: string): number {
  const n = Number(jobId.split("-").pop())
  return Number.isFinite(n) && n > 0 ? n : 1
}

function readOutput(jailDir: string): { raw: unknown; rawHadCandidates: boolean } | null {
  const outputPath = path.join(jailDir, "output.json")
  if (!existsSync(outputPath)) return null
  try {
    const raw = JSON.parse(readFileSync(outputPath, "utf8"))
    const rawHadCandidates = Array.isArray((raw as { candidates?: unknown[] })?.candidates) && (raw as { candidates: unknown[] }).candidates.length > 0
    return { raw, rawHadCandidates }
  } catch {
    return { raw: null, rawHadCandidates: false }
  }
}

// Execute one Runner Run: jail a working dir, drop mission.json, spawn the CLI, validate the
// output.json file-drop (with one repair-retry on structural failure), and record the result.
async function executeRun(
  run: StoreRun,
  adapter: ResearchRunnerAdapter,
  product: NonNullable<Awaited<ReturnType<typeof getProduct>>>,
  schema: Awaited<ReturnType<typeof getSchemaById>>,
  signal: AbortSignal,
  log: WorkerLogger,
): Promise<void> {
  const jailDir = path.join(RUNS_DIR, run.jobId, run.runner)
  mkdirSync(jailDir, { recursive: true })
  const mission = buildMission(product, schema, run.runner)
  writeFileSync(path.join(jailDir, "mission.json"), JSON.stringify(mission, null, 2))

  const basePrompt = `${mission.instructions}\n\nThe full mission — including the exact output JSON Schema your output.json must conform to — is in the file mission.json in your current working directory. Read it first, then do the research and write output.json.`
  const sequence = jobSequence(run.jobId)
  const validationCtx = { productId: product.id, runner: run.runner, sequence, baselineAttributes: product.baselineAttributes }

  markRunnerRunStarted(run.id)
  log(`[${run.runner}] start ${run.jobId}`)

  const attempt = async (prompt: string) => {
    const outcome = await runRunner(adapter, { jailDir, missionPath: path.join(jailDir, "mission.json"), prompt, timeoutMs: RUN_TIMEOUT_MS, signal })
    const output = readOutput(jailDir)
    const validated = output ? validateRunnerOutput(output.raw, { ...validationCtx, now: new Date().toISOString() }) : null
    return { outcome, output, validated }
  }

  let { outcome, output, validated } = await attempt(basePrompt)

  // One repair-retry feeding the structural errors back (ADR 0002).
  if (outcome.status !== "TIMEOUT" && outcome.status !== "CANCELLED" && validated && shouldRepairRetry(validated, output?.rawHadCandidates ?? false)) {
    const errors = validated.diagnostics.structuralErrors.slice(0, 8).join("; ") || "output.json was missing or did not validate"
    log(`[${run.runner}] repair-retry (${errors.slice(0, 80)})`)
    const repairPrompt = `${basePrompt}\n\nYour previous output.json was rejected by the validator: ${errors}. Rewrite output.json so it strictly conforms to the schema in mission.json. Remember: every candidate must cite at least one evidence entry with a real http(s) sourceUrl.`
    ;({ outcome, output, validated } = await attempt(repairPrompt))
  }

  if (outcome.status === "TIMEOUT") {
    recordRunnerRunResult(run.id, "TIMEOUT", { summary: `Timed out after ${Math.round(outcome.durationMs / 1000)}s.` })
    log(`[${run.runner}] TIMEOUT`)
    return
  }
  if (outcome.status === "CANCELLED") {
    recordRunnerRunResult(run.id, "CANCELLED", { summary: "Cancelled." })
    return
  }
  if (!validated || !validated.structurallyValid) {
    recordRunnerRunResult(run.id, "FAILED", {
      error: outcome.errorMessage ?? "no valid output.json produced",
      summary: outcome.outputExists ? "Output failed validation." : "No output.json produced.",
    })
    log(`[${run.runner}] FAILED (${outcome.errorMessage ?? "invalid output"})`)
    return
  }

  const validatedPayload: { evidence: EvidenceRecord[]; candidates: CandidateRecord[] } = {
    evidence: validated.evidence,
    candidates: validated.candidates,
  }
  recordRunnerRunResult(run.id, "SUCCEEDED", { validated: validatedPayload })
  log(`[${run.runner}] SUCCEEDED — ${validated.candidates.length} candidate(s), ${validated.evidence.length} evidence`)
}

// Process one claimed Job: run its runners in parallel (skipping unavailable ones as FAILED),
// then merge + finalize. `availableRunnerIds` is the host's detected runner pool.
export async function processJob(
  job: StoreJob,
  runs: StoreRun[],
  options: { availableRunnerIds: Set<string>; signal?: AbortSignal; log?: WorkerLogger } = { availableRunnerIds: new Set() },
): Promise<void> {
  const log = options.log ?? noopLog
  const signal = options.signal ?? new AbortController().signal
  const product = await getProduct(job.productId)
  if (!product) {
    for (const run of runs) recordRunnerRunResult(run.id, "FAILED", { error: "product not found" })
    finalizeResearchJob(job.id)
    return
  }
  const schema = await getSchemaById(product.schemaId)

  await Promise.all(
    runs.map(async (run) => {
      const adapter = getRunner(run.runner)
      if (!adapter || !options.availableRunnerIds.has(run.runner)) {
        recordRunnerRunResult(run.id, "FAILED", { error: `runner ${run.runner} unavailable`, summary: "Runner not available on this host." })
        log(`[${run.runner}] skipped (unavailable)`)
        return
      }
      try {
        await executeRun(run, adapter, product, schema, signal, log)
      } catch (error) {
        recordRunnerRunResult(run.id, "FAILED", { error: error instanceof Error ? error.message : String(error) })
        log(`[${run.runner}] threw: ${error instanceof Error ? error.message : error}`)
      }
    }),
  )

  const finalized = finalizeResearchJob(job.id)
  log(`job ${job.id} finalized: ${finalized?.status} — ${finalized?.summary}`)
}

// Claim and fully process the next QUEUED job. Returns false when the queue is empty.
export async function processNextJob(options: { availableRunnerIds: Set<string>; signal?: AbortSignal; log?: WorkerLogger }): Promise<boolean> {
  const claimed = claimNextResearchJob()
  if (!claimed) return false
  await processJob(claimed.job, claimed.runs, options)
  return true
}

export type { StoreJob, StoreRun }
export { RUN_TIMEOUT_MS }
