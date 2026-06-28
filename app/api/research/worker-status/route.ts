import { NextResponse } from "next/server"
import { getStoredSettings, getWorkerSnapshot } from "@/server/store"

export const dynamic = "force-dynamic"

// Idle-page worker status (ADR 0006): the Research page has no job id to attach to, so it polls
// this dedicated endpoint for the Worker + per-runner snapshot and the paused-intake flag. The
// Run-Research buttons do NOT use this — they read the `worker` field already on the job poll.
export async function GET() {
  return NextResponse.json({
    worker: getWorkerSnapshot(),
    researchPaused: !getStoredSettings().fakeResearchMode,
  })
}
