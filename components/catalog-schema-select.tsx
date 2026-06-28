"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

type SchemaOption = {
  id: string
  name: string
}

export function CatalogSchemaSelect({ productId, value, schemas }: { productId: string; value: string; schemas: SchemaOption[] }) {
  const router = useRouter()
  const [selectedSchemaId, setSelectedSchemaId] = useState(value)
  const [isSaving, setIsSaving] = useState(false)

  async function updateSchema(nextSchemaId: string) {
    setSelectedSchemaId(nextSchemaId)
    setIsSaving(true)
    const response = await fetch(`/api/products/${productId}/schema`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ schemaId: nextSchemaId }),
    })

    if (!response.ok) {
      // Roll back the optimistic selection AND tell the operator why — this used to revert silently.
      setSelectedSchemaId(value)
      setIsSaving(false)
      const body = await response.json().catch(() => ({}))
      toast.error(body.error ?? "Could not update the schema assignment.")
      return
    }

    setIsSaving(false)
    router.refresh()
  }

  return (
    <div className="flex min-w-56 flex-col gap-1.5">
      <select
        aria-label="Schema assignment"
        value={selectedSchemaId}
        disabled={isSaving}
        onChange={(event) => updateSchema(event.target.value)}
        className="h-9 w-full cursor-pointer rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-900 shadow-sm outline-none transition hover:border-slate-400 focus-visible:border-slate-950 focus-visible:ring-2 focus-visible:ring-slate-950/10 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {schemas.map((schema) => (
          <option key={schema.id} value={schema.id}>{schema.name}</option>
        ))}
      </select>
      {isSaving && <span className="text-xs font-medium text-slate-500" role="status">Saving schema…</span>}
    </div>
  )
}
