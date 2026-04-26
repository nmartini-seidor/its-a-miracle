import { NextResponse } from "next/server"
import { exportPreview } from "@/server/store"

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const payload = exportPreview(id)
  if (!payload) return NextResponse.json({ error: "Product not found" }, { status: 404 })
  return NextResponse.json(payload)
}
