"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2Icon, SaveIcon } from "lucide-react"
import { AuthorityScoreMeter, AuthorityTierBadge } from "@/components/aggregator/authority-tier"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getAuthorityTier } from "@/lib/aggregator-policy"
import { cn } from "@/lib/utils"
import type { AggregatorDefinition, AggregatorType, ConfidenceLevel, EvidenceRecord } from "@/lib/types"

const aggregatorTypes: AggregatorType[] = ["manufacturer", "retailer", "marketplace", "spec_database", "review_site", "internal_reference", "partner_feed"]
const confidenceLevels: ConfidenceLevel[] = ["high", "medium", "low"]

function splitLines(value: string) {
  return value.split("\n").map((item) => item.trim()).filter(Boolean)
}

function TextInput({ className, ...props }: React.ComponentProps<"input">) {
  return <input {...props} className={cn("h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-950 shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15", className)} />
}

function TextArea({ className, ...props }: React.ComponentProps<"textarea">) {
  return <textarea {...props} className={cn("min-h-28 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15", className)} />
}

function SelectInput({ className, ...props }: React.ComponentProps<"select">) {
  return <select {...props} className={cn("h-10 w-full cursor-pointer rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-950 shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15", className)} />
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

export function AggregatorConfigurationForm({ aggregator, evidence }: { aggregator: AggregatorDefinition; evidence: EvidenceRecord[] }) {
  const router = useRouter()
  const [name, setName] = useState(aggregator.name)
  const [type, setType] = useState<AggregatorType>(aggregator.type)
  const [baseUrl, setBaseUrl] = useState(aggregator.baseUrl)
  const [authorityScore, setAuthorityScore] = useState(aggregator.authorityScore)
  const [defaultConfidence, setDefaultConfidence] = useState<ConfidenceLevel>(aggregator.defaultConfidence)
  const [enabled, setEnabled] = useState(aggregator.enabled)
  const [coverageTags, setCoverageTags] = useState(aggregator.coverageTags.join("\n"))
  const [sampleDomains, setSampleDomains] = useState(aggregator.sampleDomains.join("\n"))
  const [description, setDescription] = useState(aggregator.description)
  const [confidencePolicy, setConfidencePolicy] = useState(aggregator.confidencePolicy)
  const [status, setStatus] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const tier = getAuthorityTier(authorityScore)
  const payload = useMemo(() => ({
    name,
    type,
    baseUrl,
    authorityScore,
    defaultConfidence,
    enabled,
    coverageTags: splitLines(coverageTags),
    sampleDomains: splitLines(sampleDomains),
    description,
    confidencePolicy,
  }), [name, type, baseUrl, authorityScore, defaultConfidence, enabled, coverageTags, sampleDomains, description, confidencePolicy])

  async function saveAggregator() {
    setSaving(true)
    setStatus(null)
    const response = await fetch(`/api/aggregators/${aggregator.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    const body = await response.json()
    setSaving(false)
    setStatus(response.ok ? body.message : body.error ?? "Aggregator could not be saved.")
    if (response.ok) router.refresh()
  }

  return (
    <div className="flex flex-col gap-5">
      <div className={`sticky top-16 z-10 flex flex-col gap-3 rounded-2xl border p-4 shadow-sm backdrop-blur sm:flex-row sm:items-center sm:justify-between ${tier.colorClassName}`}>
        <div className="flex flex-wrap items-center gap-3">
          <AuthorityTierBadge authorityScore={authorityScore} />
          <Badge variant="outline" className={tier.badgeClassName}>{authorityScore}/100</Badge>
          <Badge variant="outline" className={tier.badgeClassName}>{evidence.length} evidence records</Badge>
          <span className="text-sm font-semibold">{tier.importance}</span>
        </div>
        <div className="flex items-center gap-3">
          {status && <span className="text-sm" role="status">{status}</span>}
          <Button type="button" onClick={saveAggregator} disabled={saving}>
            {saving ? <Loader2Icon className="size-4 animate-spin" /> : <SaveIcon data-icon="inline-start" />}
            Save aggregator
          </Button>
        </div>
      </div>

      <FieldBlock title="Identity" description="Configure how this source appears in evidence review and candidate generation.">
        <div className="grid gap-4 lg:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">Name<TextInput value={name} onChange={(event) => setName(event.target.value)} /></label>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">ID<TextInput value={aggregator.id} readOnly className="bg-slate-50 text-slate-500" /></label>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">Type<SelectInput value={type} onChange={(event) => setType(event.target.value as AggregatorType)}>{aggregatorTypes.map((item) => <option key={item} value={item}>{item.replaceAll("_", " ")}</option>)}</SelectInput></label>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">Base URL<TextInput value={baseUrl} onChange={(event) => setBaseUrl(event.target.value)} /></label>
        </div>
        <label className="mt-4 flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-800">
          <input type="checkbox" checked={enabled} onChange={(event) => setEnabled(event.target.checked)} className="size-4 cursor-pointer accent-slate-950" />
          Enabled in the review workflow
        </label>
      </FieldBlock>

      <FieldBlock title="Authority and confidence" description="Set the source importance. Higher authority means a source can carry more weight in candidate decisions.">
        <div className="grid gap-5 lg:grid-cols-[1fr_16rem] lg:items-end">
          <label className="flex flex-col gap-3 text-sm font-medium text-slate-700">
            Authority score
            <input type="range" min={0} max={100} value={authorityScore} onChange={(event) => setAuthorityScore(Number(event.target.value))} className="w-full cursor-pointer accent-slate-950" />
          </label>
          <AuthorityScoreMeter authorityScore={authorityScore} />
        </div>
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">Default confidence<SelectInput value={defaultConfidence} onChange={(event) => setDefaultConfidence(event.target.value as ConfidenceLevel)}>{confidenceLevels.map((item) => <option key={item} value={item}>{item}</option>)}</SelectInput></label>
          <div className={`rounded-xl border p-4 text-sm leading-6 ${tier.colorClassName}`}><strong>{tier.label}:</strong> {tier.importance}</div>
        </div>
      </FieldBlock>

      <FieldBlock title="Coverage" description="Tags and domains explain what this aggregator can prove.">
        <div className="grid gap-4 lg:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">Coverage tags, one per line<TextArea value={coverageTags} onChange={(event) => setCoverageTags(event.target.value)} /></label>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">Sample domains, one per line<TextArea value={sampleDomains} onChange={(event) => setSampleDomains(event.target.value)} /></label>
        </div>
      </FieldBlock>

      <FieldBlock title="Review guidance" description="Plain-language guidance for reviewers deciding whether evidence is strong enough.">
        <div className="grid gap-4 lg:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">Description<TextArea value={description} onChange={(event) => setDescription(event.target.value)} /></label>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">Confidence policy<TextArea value={confidencePolicy} onChange={(event) => setConfidencePolicy(event.target.value)} /></label>
        </div>
      </FieldBlock>

      <FieldBlock title="Current evidence" description="Evidence already collected from this source remains visible while configuring importance.">
        <div className="divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-white">
          {evidence.length > 0 ? evidence.map((record) => (
            <div key={record.id} className="grid gap-2 p-4 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <p className="font-semibold text-slate-950">{record.title}</p>
                <p className="text-sm text-slate-600">{record.summary}</p>
              </div>
              <Badge variant="outline">{record.confidence}</Badge>
            </div>
          )) : <p className="p-4 text-sm text-slate-600">No evidence records currently use this aggregator.</p>}
        </div>
      </FieldBlock>
    </div>
  )
}
