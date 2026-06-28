import { NextResponse } from "next/server"
import { getProduct } from "@/server/data"
import { createResearchJob, getWorkerSnapshot } from "@/server/store"

// Enqueue a Research Job, refusing doomed/disallowed jobs at the door with a specific status
// (ADR 0006) instead of creating a job that silently never progresses:
//   404 product not found · 503 Worker offline/unknown · 422 Worker up but zero usable runners ·
//   409 RESEARCH_PAUSED (intake paused in Settings — deliberately distinct from worker-down).
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const product = await getProduct(id)
  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 })

  // Worker liveness guards come BEFORE creating anything, so we never queue a job that can't run.
  const worker = getWorkerSnapshot()
  if (worker.state !== "online") {
    return NextResponse.json(
      { error: "Worker not running — start it with `pnpm worker`, then run research again.", code: "WORKER_OFFLINE", worker },
      { status: 503 },
    )
  }
  if (worker.availableRunnerCount === 0) {
    return NextResponse.json(
      {
        error: "No research runners are available on this host. Install/log in to a runner CLI (cursor-agent, codex, or claude), then try again.",
        code: "NO_RUNNERS",
        worker,
      },
      { status: 422 },
    )
  }

  const result = createResearchJob(id)
  if (!result.ok) {
    if (result.reason === "paused") {
      return NextResponse.json(
        { error: "Research intake is paused in Settings. Set Research jobs to Enabled to queue new research.", code: "RESEARCH_PAUSED" },
        { status: 409 },
      )
    }
    // product existed a moment ago; product_not_found here is a defensive fallthrough.
    return NextResponse.json({ error: "Product not found" }, { status: 404 })
  }

  return NextResponse.json(result.job)
}
