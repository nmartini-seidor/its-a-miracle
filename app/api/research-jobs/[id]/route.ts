import { NextResponse } from "next/server"
import { getResearchJobWithRuns, getWorkerSnapshot } from "@/server/store"

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const result = getResearchJobWithRuns(id)
  if (!result) return NextResponse.json({ error: "Research job not found" }, { status: 404 })
  // Flat job fields (status/summary) for the poll loop, plus per-run lanes for the live UI, plus
  // the Worker liveness snapshot (ADR 0006) — the polling button reads `worker` to detect a Worker
  // that died mid-job instead of spinning on QUEUED forever. No separate polling endpoint, so the
  // two reads can never disagree (TOCTOU).
  return NextResponse.json({ ...result.job, runs: result.runs, worker: getWorkerSnapshot() })
}
