import { NextResponse } from "next/server"
import { generateSeoDescriptionCandidate } from "@/server/store"

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const generated = generateSeoDescriptionCandidate(id)
  if (!generated) return NextResponse.json({ error: "Product not found" }, { status: 404 })
  return NextResponse.json({ candidate: generated.candidate, evidence: generated.evidence, message: "SEO description generated." })
}
