"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2Icon, SaveIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ATTRIBUTE_FIELD_LABELS } from "@/lib/demo-contract"
import type { AttributeFieldId, ProductRecord, SchemaDefinition } from "@/lib/types"

const attributeOptions = Object.entries(ATTRIBUTE_FIELD_LABELS).filter(([field]) => field !== "researchSummary") as [AttributeFieldId, string][]

function splitLines(value: string) {
  return value.split("\n").map((item) => item.trim()).filter(Boolean)
}

function TextInput(props: React.ComponentProps<"input">) {
  return <input {...props} className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-950 shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15" />
}

function TextArea(props: React.ComponentProps<"textarea">) {
  return <textarea {...props} className="min-h-28 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15" />
}

function FieldBlock({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
      <div className="mb-4">
        <h2 className="text-lg font-semibold tracking-[-0.02em] text-slate-950">{title}</h2>
        <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">{description}</p>
      </div>
      {children}
    </section>
  )
}

function AttributePicker({ label, values, onChange }: { label: string; values: AttributeFieldId[]; onChange: (values: AttributeFieldId[]) => void }) {
  const selected = new Set(values)

  function toggle(field: AttributeFieldId, checked: boolean) {
    const next = new Set(values)
    if (checked) next.add(field)
    else next.delete(field)
    onChange([...next])
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-slate-950">{label}</h3>
        <Badge variant="outline">{values.length} selected</Badge>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {attributeOptions.map(([field, fieldLabel]) => (
          <label key={field} className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-sm transition hover:border-blue-300 hover:bg-blue-50/50">
            <input type="checkbox" checked={selected.has(field)} onChange={(event) => toggle(field, event.target.checked)} className="size-4 cursor-pointer accent-slate-950" />
            <span>{fieldLabel}</span>
          </label>
        ))}
      </div>
    </div>
  )
}

export function SchemaConfigurationForm({ schema, assignedProducts }: { schema: SchemaDefinition; assignedProducts: ProductRecord[] }) {
  const router = useRouter()
  const [name, setName] = useState(schema.name)
  const [linkedCategories, setLinkedCategories] = useState(schema.linkedCategories.join("\n"))
  const [requiredAttributes, setRequiredAttributes] = useState(schema.requiredAttributes)
  const [recommendedAttributes, setRecommendedAttributes] = useState(schema.recommendedAttributes)
  const [warningRules, setWarningRules] = useState(schema.warningRules.join("\n"))
  const [scoringRules, setScoringRules] = useState(schema.scoringRules.join("\n"))
  const [status, setStatus] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const payload = useMemo(() => ({
    name,
    linkedCategories: splitLines(linkedCategories),
    requiredAttributes,
    recommendedAttributes,
    warningRules: splitLines(warningRules),
    scoringRules: splitLines(scoringRules),
  }), [name, linkedCategories, requiredAttributes, recommendedAttributes, warningRules, scoringRules])

  async function saveSchema() {
    setSaving(true)
    setStatus(null)
    const response = await fetch(`/api/schemas/${schema.slug}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    const body = await response.json()
    setSaving(false)
    setStatus(response.ok ? body.message : body.error ?? "Schema could not be saved.")
    if (response.ok) router.refresh()
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="sticky top-16 z-10 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">/{schema.slug}</Badge>
          <Badge variant="secondary">{assignedProducts.length} mapped products</Badge>
          <Badge variant="secondary">{requiredAttributes.length} required fields</Badge>
        </div>
        <div className="flex items-center gap-3">
          {status && <span className="text-sm text-slate-600" role="status">{status}</span>}
          <Button type="button" onClick={saveSchema} disabled={saving}>
            {saving ? <Loader2Icon className="size-4 animate-spin" /> : <SaveIcon data-icon="inline-start" />}
            Save schema
          </Button>
        </div>
      </div>

      <FieldBlock title="Identity" description="Configure the label and category paths that route products into this schema.">
        <div className="grid gap-4 lg:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Schema name
            <TextInput value={name} onChange={(event) => setName(event.target.value)} />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Slug
            <TextInput value={schema.slug} readOnly className="bg-slate-50 text-slate-500" />
          </label>
        </div>
        <label className="mt-4 flex flex-col gap-2 text-sm font-medium text-slate-700">
          Linked categories, one per line
          <TextArea value={linkedCategories} onChange={(event) => setLinkedCategories(event.target.value)} />
        </label>
      </FieldBlock>

      <FieldBlock title="Field requirements" description="Select which attributes block review exit and which attributes improve score quality.">
        <div className="grid gap-6 2xl:grid-cols-2">
          <AttributePicker label="Required attributes" values={requiredAttributes} onChange={setRequiredAttributes} />
          <AttributePicker label="Recommended attributes" values={recommendedAttributes} onChange={setRecommendedAttributes} />
        </div>
      </FieldBlock>

      <FieldBlock title="Rules" description="Warning and scoring rules are configurable text rules that operators can tune for each schema family.">
        <div className="grid gap-4 lg:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Warning rules, one per line
            <TextArea value={warningRules} onChange={(event) => setWarningRules(event.target.value)} />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Scoring rules, one per line
            <TextArea value={scoringRules} onChange={(event) => setScoringRules(event.target.value)} />
          </label>
        </div>
      </FieldBlock>

      <FieldBlock title="Mapped products" description="Products currently using this schema stay visible while the schema is configured.">
        <div className="divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-white">
          {assignedProducts.length > 0 ? assignedProducts.map((product) => (
            <div key={product.id} className="grid gap-2 p-4 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <p className="font-semibold text-slate-950">{product.title}</p>
                <p className="text-sm text-slate-600">{product.miraklProductId} · {product.categoryPath.join(" / ")}</p>
              </div>
              <Badge variant="outline">Score {product.qualityScore}/100</Badge>
            </div>
          )) : <p className="p-4 text-sm text-slate-600">No products are currently mapped to this schema.</p>}
        </div>
      </FieldBlock>
    </div>
  )
}
