import { NextResponse } from "next/server"
import { schemas } from "@/lib/fixtures"
import { updateStoredProductSchema } from "@/server/store"

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await request.json().catch(() => null)

  if (!body || typeof body !== "object" || Array.isArray(body) || typeof body.schemaId !== "string") {
    return NextResponse.json({ error: "Expected a schemaId value." }, { status: 400 })
  }

  const product = updateStoredProductSchema(schemas, id, body.schemaId)
  if (!product) return NextResponse.json({ error: "Product or schema not found" }, { status: 404 })

  return NextResponse.json({ product, message: "Schema assignment saved." })
}
