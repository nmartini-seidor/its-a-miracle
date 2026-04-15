import { NextResponse } from "next/server"
import { exportPreview } from "@/server/store"

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const preview = exportPreview(id)
  if (!preview) return NextResponse.json({ error: "Product not found" }, { status: 404 })
  return NextResponse.json(preview)
}
