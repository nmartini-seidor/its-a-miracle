import { NextResponse } from "next/server"
import { isAttributeFieldId } from "@/lib/demo-contract"
import { schemas } from "@/lib/fixtures"
import type { AttributeFieldId, SchemaDefinition } from "@/lib/types"
import { updateStoredSchema } from "@/server/store"

function asStringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean) : []
}

function asAttributeArray(value: unknown): AttributeFieldId[] {
  return asStringArray(value).filter(isAttributeFieldId)
}

function parseSchemaPatch(existing: SchemaDefinition, body: Record<string, unknown>): SchemaDefinition {
  return {
    ...existing,
    name: typeof body.name === "string" && body.name.trim() ? body.name.trim() : existing.name,
    linkedCategories: asStringArray(body.linkedCategories),
    requiredAttributes: asAttributeArray(body.requiredAttributes),
    recommendedAttributes: asAttributeArray(body.recommendedAttributes),
    warningRules: asStringArray(body.warningRules),
    scoringRules: asStringArray(body.scoringRules),
    exampleProductIds: existing.exampleProductIds,
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const existing = schemas.find((schema) => schema.slug === slug)
  if (!existing) return NextResponse.json({ error: "Schema not found" }, { status: 404 })

  const body = await request.json().catch(() => null)
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Expected a schema configuration object." }, { status: 400 })
  }

  const schema = updateStoredSchema(schemas, slug, parseSchemaPatch(existing, body as Record<string, unknown>))
  return NextResponse.json({ schema, message: "Schema configuration saved." })
}
