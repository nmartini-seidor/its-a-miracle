"use client"

import { useState, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { CheckIcon, DatabaseIcon, FileCheck2Icon, Layers3Icon, Loader2Icon, RadioTowerIcon, SaveIcon, ShieldCheckIcon, SlidersHorizontalIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ResetWorkspaceButton } from "@/components/settings/reset-workspace-button"
import type { AggregatorDefinition, ConfidenceLevel, SchemaDefinition, SettingsSnapshot } from "@/lib/types"
import { cn } from "@/lib/utils"

type SettingsTabsProps = {
  initialSettings: SettingsSnapshot
  schemas: SchemaDefinition[]
  aggregators: AggregatorDefinition[]
}

type TabConfig = {
  value: string
  label: string
  description: string
  icon: typeof SlidersHorizontalIcon
}

const tabs: TabConfig[] = [
  { value: "workspace", label: "Workspace", description: "Endpoint, environment, and local catalog state", icon: SlidersHorizontalIcon },
  { value: "research", label: "Research", description: "Job pacing and candidate defaults", icon: RadioTowerIcon },
  { value: "schemas", label: "Schemas", description: "Category matching and required fields", icon: Layers3Icon },
  { value: "evidence", label: "Evidence", description: "Source enablement and trust order", icon: DatabaseIcon },
  { value: "export", label: "Export", description: "Approval policy and export guardrails", icon: FileCheck2Icon },
]

function formatConfidence(confidence: string) {
  return confidence.charAt(0).toUpperCase() + confidence.slice(1)
}

function providerTypeLabel(type: string) {
  return type.replaceAll("_", " ")
}

function SectionHeader({ title, description, children }: { title: string; description: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col gap-4 border-b border-slate-200/80 bg-white px-5 py-5 sm:flex-row sm:items-start sm:justify-between sm:px-6">
      <div className="min-w-0">
        <h2 className="text-xl font-semibold tracking-[-0.02em] text-slate-950">{title}</h2>
        <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">{description}</p>
      </div>
      {children && <div className="shrink-0">{children}</div>}
    </div>
  )
}

function FieldRow({
  label,
  description,
  children,
}: {
  label: string
  description: string
  children: ReactNode
}) {
  return (
    <div className="grid gap-3 px-5 py-5 sm:grid-cols-[minmax(14rem,0.8fr)_minmax(18rem,1fr)] sm:items-center sm:px-6">
      <div>
        <div className="text-sm font-semibold text-slate-950">{label}</div>
        <p className="mt-1 max-w-lg text-sm leading-6 text-slate-600">{description}</p>
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  )
}

function TextInput(props: React.ComponentProps<"input">) {
  return (
    <input
      {...props}
      className={cn(
        "h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-950 shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15 disabled:bg-slate-50 disabled:text-slate-500",
        props.className,
      )}
    />
  )
}

function SelectInput(props: React.ComponentProps<"select">) {
  return (
    <select
      {...props}
      className={cn(
        "h-10 w-full cursor-pointer rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-950 shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15",
        props.className,
      )}
    />
  )
}

function CheckboxControl({ checked, onChange, label, description }: { checked: boolean; onChange: (checked: boolean) => void; label: string; description?: string }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 transition hover:border-blue-300 hover:bg-blue-50/40">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 size-4 cursor-pointer rounded border-slate-300 text-blue-600 accent-blue-600"
      />
      <span className="flex min-w-0 flex-col gap-1">
        <span className="text-sm font-semibold text-slate-950">{label}</span>
        {description && <span className="text-sm leading-5 text-slate-600">{description}</span>}
      </span>
    </label>
  )
}

function InlineStatus({ dirty, saving, status }: { dirty: boolean; saving: boolean; status: string | null }) {
  if (saving) return <span className="text-sm text-slate-600">Saving configuration…</span>
  if (status) return <span className="text-sm text-slate-600">{status}</span>
  if (dirty) return <span className="text-sm text-amber-700">Unsaved changes</span>
  return <span className="text-sm text-emerald-700">Saved</span>
}

export function SettingsTabs({ initialSettings, schemas, aggregators }: SettingsTabsProps) {
  const router = useRouter()
  const [settings, setSettings] = useState(initialSettings)
  const [savedSettings, setSavedSettings] = useState(initialSettings)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<string | null>(null)

  const dirty = JSON.stringify(settings) !== JSON.stringify(savedSettings)

  function updateSetting<Key extends keyof SettingsSnapshot>(key: Key, value: SettingsSnapshot[Key]) {
    setSettings((current) => ({ ...current, [key]: value }))
    setStatus(null)
  }

  function toggleAggregator(id: string, enabled: boolean) {
    setSettings((current) => {
      const ids = new Set(current.enabledAggregatorIds)
      if (enabled) ids.add(id)
      else ids.delete(id)
      return { ...current, enabledAggregatorIds: [...ids] }
    })
    setStatus(null)
  }

  async function saveSettings() {
    setSaving(true)
    setStatus(null)
    const response = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    })
    const body = await response.json()
    setSaving(false)

    if (!response.ok) {
      setStatus(body.error ?? "Settings could not be saved.")
      return
    }

    setSettings(body.settings)
    setSavedSettings(body.settings)
    setStatus(body.message ?? "Workspace settings saved.")
    router.refresh()
  }

  return (
    <Tabs defaultValue="workspace" className="grid gap-5 lg:grid-cols-[17rem_minmax(0,1fr)]">
      <TabsList className="grid h-fit w-full grid-cols-2 gap-1 rounded-2xl border-slate-200 bg-white p-1.5 shadow-sm lg:sticky lg:top-5 lg:grid-cols-1 lg:items-stretch">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <TabsTrigger key={tab.value} value={tab.value} className="h-auto min-w-0 justify-start gap-3 whitespace-normal px-3 py-3 text-left data-[state=active]:bg-slate-950 data-[state=active]:text-white">
              <Icon className="size-4 shrink-0" />
              <span className="min-w-0 flex-1 overflow-hidden">
                <span className="block text-sm font-semibold leading-5">{tab.label}</span>
                <span className="hidden max-w-full text-wrap break-words text-xs font-normal leading-5 opacity-75 lg:block">{tab.description}</span>
              </span>
            </TabsTrigger>
          )
        })}
      </TabsList>

      <div className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50/80 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="min-w-0 text-sm font-medium text-slate-600">Changes are saved locally for this operator workspace.</div>
          <div className="flex flex-wrap items-center gap-3">
            <InlineStatus dirty={dirty} saving={saving} status={status} />
            <Button type="button" onClick={saveSettings} disabled={!dirty || saving}>
              {saving ? <Loader2Icon className="size-4 animate-spin" /> : <SaveIcon data-icon="inline-start" />}
              Save changes
            </Button>
          </div>
        </div>

        <TabsContent value="workspace" className="m-0">
          <SectionHeader title="Workspace" description="Configure the operator-facing connection metadata and manage the local catalog state." />
          <div className="divide-y divide-slate-200/80">
            <FieldRow label="Mirakl base URL" description="Displayed as the configured endpoint. Secrets remain server-side and are never shown here.">
              <TextInput value={settings.miraklBaseUrl} onChange={(event) => updateSetting("miraklBaseUrl", event.target.value)} aria-label="Mirakl base URL" />
            </FieldRow>
            <FieldRow label="Execution environment" description="This workspace runs local review flows only. Export and Mirakl write actions remain approval-gated.">
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="bg-blue-50 text-blue-900">Operator review</Badge>
                <Badge variant="outline">Server-managed secrets</Badge>
                <Badge variant="outline">Approval before export</Badge>
              </div>
            </FieldRow>
            <FieldRow label="Catalog state" description="Clear the workspace or import the electronics catalog without leaving settings.">
              <ResetWorkspaceButton compact />
            </FieldRow>
          </div>
        </TabsContent>

        <TabsContent value="research" className="m-0">
          <SectionHeader title="Research defaults" description="Control the evidence collection cadence and the confidence assigned to new candidate values." />
          <div className="divide-y divide-slate-200/80">
            <FieldRow label="Research jobs" description="Enable or pause evidence collection controls for product review workflows.">
              <CheckboxControl
                checked={settings.fakeResearchMode}
                onChange={(checked) => updateSetting("fakeResearchMode", checked)}
                label={settings.fakeResearchMode ? "Enabled" : "Paused"}
                description="When enabled, reviewers can queue product research jobs from product detail pages."
              />
            </FieldRow>
            <FieldRow label="Default job delay" description="Seconds used for queued and running state timing before completion.">
              <div className="flex max-w-xs items-center gap-3">
                <TextInput
                  type="number"
                  min={5}
                  max={300}
                  value={settings.defaultResearchDelaySeconds}
                  onChange={(event) => updateSetting("defaultResearchDelaySeconds", Number(event.target.value))}
                  aria-label="Default research delay seconds"
                />
                <span className="text-sm text-slate-600">seconds</span>
              </div>
            </FieldRow>
            <FieldRow label="Max evidence per product" description="Limit how much supporting material appears per product review.">
              <TextInput
                type="number"
                min={1}
                max={10}
                value={settings.maxEvidencePerProduct}
                onChange={(event) => updateSetting("maxEvidencePerProduct", Number(event.target.value))}
                aria-label="Maximum evidence records per product"
                className="max-w-xs"
              />
            </FieldRow>
            <FieldRow label="Default candidate confidence" description="Initial confidence level used when new candidate values are created.">
              <SelectInput
                value={settings.defaultCandidateConfidence}
                onChange={(event) => updateSetting("defaultCandidateConfidence", event.target.value as ConfidenceLevel)}
                aria-label="Default candidate confidence"
                className="max-w-xs"
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </SelectInput>
            </FieldRow>
          </div>
        </TabsContent>

        <TabsContent value="schemas" className="m-0">
          <SectionHeader title="Schema matching" description="Keep category matching explicit so reviewers understand which fields are required for each product family." />
          <div className="divide-y divide-slate-200/80">
            <FieldRow label="Auto-assign by category" description="Use the Mirakl category path to pre-select a schema family before review begins.">
              <CheckboxControl
                checked={settings.autoAssignSchemaByCategory}
                onChange={(checked) => updateSetting("autoAssignSchemaByCategory", checked)}
                label={settings.autoAssignSchemaByCategory ? "Auto-assignment enabled" : "Manual schema selection"}
                description="Reviewers can still inspect the matched schema on each product detail page."
              />
            </FieldRow>
            <div className="px-5 py-5 sm:px-6">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-slate-950">Configured schema families</h3>
                <Badge variant="outline">{schemas.length} total</Badge>
              </div>
              <div className="overflow-hidden rounded-xl border border-slate-200">
                <div className="grid grid-cols-[1fr_auto] bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 sm:grid-cols-[1fr_1fr_auto]">
                  <span>Schema</span>
                  <span className="hidden sm:block">Required fields</span>
                  <span>Categories</span>
                </div>
                <div className="divide-y divide-slate-200">
                  {schemas.map((schema) => (
                    <div key={schema.id} className="grid gap-3 px-4 py-4 text-sm sm:grid-cols-[1fr_1fr_auto] sm:items-center">
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-950">{schema.name}</div>
                        <div className="mt-1 text-xs text-slate-500">{schema.slug}</div>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {schema.requiredAttributes.slice(0, 5).map((attribute) => <Badge key={attribute} variant="secondary" className="bg-slate-100">{attribute}</Badge>)}
                      </div>
                      <div className="text-sm text-slate-600">{schema.linkedCategories.length}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="evidence" className="m-0">
          <SectionHeader title="Evidence sources" description="Enable the aggregators that should appear as evidence columns and candidate sources during review." />
          <div className="divide-y divide-slate-200/80">
            {aggregators.map((aggregator) => {
              const enabled = settings.enabledAggregatorIds.includes(aggregator.id)
              return (
                <div key={aggregator.id} className="grid gap-4 px-5 py-5 sm:grid-cols-[minmax(16rem,1fr)_auto] sm:items-center sm:px-6">
                  <CheckboxControl
                    checked={enabled}
                    onChange={(checked) => toggleAggregator(aggregator.id, checked)}
                    label={aggregator.name}
                    description={aggregator.description}
                  />
                  <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                    <Badge variant="outline">{providerTypeLabel(aggregator.type)}</Badge>
                    <Badge variant="secondary" className="bg-blue-50 text-blue-900">Authority {aggregator.authorityScore}/100</Badge>
                    <Badge variant="outline">{formatConfidence(aggregator.defaultConfidence)}</Badge>
                  </div>
                </div>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="export" className="m-0">
          <SectionHeader title="Export governance" description="Keep export behavior narrow: accepted values only, evidence attached, and operator approval before submission." />
          <div className="divide-y divide-slate-200/80">
            <FieldRow label="Export scope" description="Only accepted candidate values are included in export payloads.">
              <Badge variant="secondary" className="bg-emerald-50 text-emerald-900">Accepted values only</Badge>
            </FieldRow>
            <FieldRow label="Approval posture" description="Candidate values move through review, approval, and export preparation as separate workflow steps.">
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  "Operator approval required",
                  "Evidence ranked by authority",
                  "Schema governed comparisons",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-medium text-slate-800">
                    <CheckIcon className="size-4 text-emerald-600" />
                    {item}
                  </div>
                ))}
              </div>
            </FieldRow>
            <FieldRow label="Safety boundary" description="The workspace can prepare review material, but Mirakl submission remains a deliberate approved action.">
              <div className="flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm leading-6 text-blue-950">
                <ShieldCheckIcon className="size-5 shrink-0" />
                <span>No direct Mirakl write, import submission, or publish action is executed from this settings page.</span>
              </div>
            </FieldRow>
          </div>
        </TabsContent>
      </div>
    </Tabs>
  )
}
