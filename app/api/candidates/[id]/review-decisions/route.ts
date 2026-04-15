import { NextResponse } from "next/server"
import { z } from "zod"
import { addReviewDecision } from "@/server/store"

const schema = z.object({ decision: z.enum(["APPROVE", "REJECT", "REQUEST_MORE_EVIDENCE"]), reason: z.string().optional() })

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = schema.parse(await request.json())
  const decision = addReviewDecision(id, body.decision, body.reason)
  if (!decision) return NextResponse.json({ error: "Candidate not found" }, { status: 404 })
  return NextResponse.json(decision)
}
