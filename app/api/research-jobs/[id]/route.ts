import { NextResponse } from "next/server"
import { getResearchRun } from "@/server/store"

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const run = getResearchRun(id)
  if (!run) return NextResponse.json({ error: "Research job not found" }, { status: 404 })
  return NextResponse.json(run)
}
