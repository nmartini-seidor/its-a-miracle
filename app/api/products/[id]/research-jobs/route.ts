import { NextResponse } from "next/server"
import { getProduct } from "@/server/data"
import { createMockResearchRun } from "@/server/store"

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const product = await getProduct(id)
  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 })
  return NextResponse.json(createMockResearchRun(product.id))
}
