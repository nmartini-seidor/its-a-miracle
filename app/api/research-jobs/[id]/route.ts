import { NextResponse } from "next/server"
import { getResearchJobWithRuns } from "@/server/store"

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const result = getResearchJobWithRuns(id)
  if (!result) return NextResponse.json({ error: "Research job not found" }, { status: 404 })
  // Flat job fields (status/summary) for the poll loop, plus per-run lanes for the live UI.
  return NextResponse.json({ ...result.job, runs: result.runs })
}
