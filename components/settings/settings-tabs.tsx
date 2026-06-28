"use client"

import { useState, type ReactNode } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import {
  ArrowLeftIcon,
  CheckCircle2Icon,
  CheckIcon,
  DatabaseIcon,
  FileCheck2Icon,
  Layers3Icon,
  Loader2Icon,
  PlugZapIcon,
  RadioTowerIcon,
  SaveIcon,
  ShieldCheckIcon,
  SlidersHorizontalIcon,
  type LucideIcon,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
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
  icon: LucideIcon
}

type IntegrationProvider = {
  id: "mirakl" | "akeneo" | "salsify" | "inriver" | "sales-layer"
  name: string
  description: string
  logoSrc: string
  href: string
}

type ConnectedIntegration = {
  id: string
  name: string
  baseUrl: string
  maskedOperatorKey: string
  connectedAt: string
}

const tabs: TabConfig[] = [
  { value: "integrations", label: "Integrations", description: "Connect source and enrichment systems for catalog workflows", icon: PlugZapIcon },
  { value: "workspace", label: "Workspace", description: "Environment and local catalog state", icon: SlidersHorizontalIcon },
  { value: "research", label: "Research", description: "Job pacing and candidate defaults", icon: RadioTowerIcon },
  { value: "schemas", label: "Schemas", description: "Category matching and required fields", icon: Layers3Icon },
  { value: "evidence", label: "Evidence", description: "Source enablement and trust order", icon: DatabaseIcon },
  { value: "export", label: "Export", description: "Approval policy and export guardrails", icon: FileCheck2Icon },
]

const integrationProviders: IntegrationProvider[] = [
  {
    id: "mirakl",
    name: "MIRAKL",
    description: "Marketplace operator API connectivity for catalog and product workflow checks.",
    logoSrc: "/logos/mirakl.svg",
    href: "#mirakl",
  },
  {
    id: "akeneo",
    name: "Akeneo",
    description: "PIM connectivity for product information enrichment and attribute governance.",
    logoSrc: "/logos/akeneo.svg",
    href: "#",
  },
  {
    id: "salsify",
    name: "Salsify",
    description: "PXM connectivity for source content, syndication, and commerce-ready product data.",
    logoSrc: "/logos/salsify.svg",
    href: "#",
  },
  {
    id: "inriver",
    name: "inriver",
    description: "PIM connectivity for structured product data and commerce enrichment workflows.",
    logoSrc: "/logos/inriver.svg",
    href: "#",
  },
  {
    id: "sales-layer",
    name: "Sales Layer",
    description: "PIM connectivity for catalog distribution and channel-ready product content.",
    logoSrc: "/logos/sales-layer.png",
    href: "#",
  },
]

function formatConfidence(confidence: string) {
  return confidence.charAt(0).toUpperCase() + confidence.slice(1)
}

function providerTypeLabel(type: string) {
  return type.replaceAll("_", " ")
}

function maskOperatorKey(operatorKey: string) {
  const key = operatorKey.trim()
  if (key.length <= 4) return "Verified key"
  return `**** ${key.slice(-4)}`
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
  const [activeTab, setActiveTab] = useState("integrations")
  const [selectedIntegration, setSelectedIntegration] = useState<IntegrationProvider["id"] | null>(null)
  const [integrationForm, setIntegrationForm] = useState({ miraklBaseUrl: "", operatorKey: "" })
  const [integrationStatus, setIntegrationStatus] = useState<string | null>(null)
  const [checkingIntegration, setCheckingIntegration] = useState(false)
  const [connectedIntegrations, setConnectedIntegrations] = useState<ConnectedIntegration[]>([])

  const dirty = JSON.stringify(settings) !== JSON.stringify(savedSettings)
  const currentTab = tabs.find((tab) => tab.value === activeTab) ?? tabs[0]

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
    try {
      const response = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      })
      // Guard the parse so a non-JSON response can't throw and leave the Save button spinning forever.
      const body = await response.json().catch(() => ({}))

      if (!response.ok) {
        setStatus(body.error ?? "Settings could not be saved.")
        return
      }

      if (body.settings) {
        setSettings(body.settings)
        setSavedSettings(body.settings)
      }
      setStatus(body.message ?? "Workspace settings saved.")
      router.refresh()
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Settings could not be saved.")
    } finally {
      setSaving(false)
    }
  }

  function updateIntegrationForm<Key extends keyof typeof integrationForm>(key: Key, value: (typeof integrationForm)[Key]) {
    setIntegrationForm((current) => ({ ...current, [key]: value }))
    setIntegrationStatus(null)
  }

  function selectIntegration(provider: IntegrationProvider) {
    if (provider.id !== "mirakl") return
    setSelectedIntegration(provider.id)
    setIntegrationForm({ miraklBaseUrl: "", operatorKey: "" })
    setIntegrationStatus(null)
  }

  async function confirmMiraklIntegration() {
    const miraklBaseUrl = integrationForm.miraklBaseUrl.trim()
    const operatorKey = integrationForm.operatorKey.trim()

    if (!miraklBaseUrl || !operatorKey) {
      setIntegrationStatus("Mirakl URL and operator key are required.")
      return
    }

    setCheckingIntegration(true)
    setIntegrationStatus(null)

    const response = await fetch("/api/integrations/mirakl/connectivity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ miraklBaseUrl, operatorKey }),
    })
    const body = await response.json().catch(() => ({ error: "Connectivity check failed." }))
    setCheckingIntegration(false)

    if (!response.ok) {
      setIntegrationStatus(body.error ?? "Connectivity check failed.")
      return
    }

    const connectedAt = new Date().toISOString()
    setConnectedIntegrations((current) => [
      {
        id: `mirakl-${connectedAt}`,
        name: "MIRAKL",
        baseUrl: body.miraklBaseUrl ?? miraklBaseUrl,
        maskedOperatorKey: maskOperatorKey(operatorKey),
        connectedAt,
      },
      ...current,
    ])
    updateSetting("miraklBaseUrl", body.miraklBaseUrl ?? miraklBaseUrl)
    setIntegrationForm({ miraklBaseUrl: body.miraklBaseUrl ?? miraklBaseUrl, operatorKey: "" })
    setSelectedIntegration(null)
    setIntegrationStatus(body.message ?? "MIRAKL connectivity confirmed.")
  }

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="grid gap-5 lg:grid-cols-[14rem_minmax(0,1fr)]">
      <TabsList className="grid h-fit w-full grid-cols-2 gap-1 rounded-2xl border-slate-200 bg-white p-1.5 shadow-sm lg:sticky lg:top-5 lg:grid-cols-1 lg:items-stretch">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <TabsTrigger key={tab.value} value={tab.value} className="h-auto min-w-0 justify-start gap-3 px-3 py-3 text-left data-[state=active]:bg-slate-950 data-[state=active]:text-white">
              <Icon className="size-4 shrink-0" />
              <span className="truncate text-sm font-semibold leading-5">{tab.label}</span>
            </TabsTrigger>
          )
        })}
      </TabsList>

      <div className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-200 bg-slate-50/80 px-5 py-5 sm:flex-row sm:items-start sm:justify-between sm:px-6">
          <div className="min-w-0">
            <h2 className="text-xl font-semibold tracking-[-0.02em] text-slate-950">{currentTab.label}</h2>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">{currentTab.description}</p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-3">
            <InlineStatus dirty={dirty} saving={saving} status={status} />
            <Button type="button" onClick={saveSettings} disabled={!dirty || saving}>
              {saving ? <Loader2Icon className="size-4 animate-spin" /> : <SaveIcon data-icon="inline-start" />}
              Save changes
            </Button>
          </div>
        </div>

        <TabsContent value="workspace" className="m-0">
          <div className="divide-y divide-slate-200/80">
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

        <TabsContent value="integrations" className="m-0">
          <div className="flex flex-col gap-5 p-5 sm:p-6">
            {connectedIntegrations.length > 0 && (
              <section className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold text-slate-950">Configured systems</h3>
                  <Badge variant="outline">{connectedIntegrations.length} connected</Badge>
                </div>
                <div className="grid gap-3">
                  {connectedIntegrations.map((integration) => (
                    <div key={integration.id} className="flex flex-col gap-3 rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-700 shadow-sm">
                          <CheckCircle2Icon className="size-5" />
                        </span>
                        <div className="min-w-0">
                          <div className="font-semibold text-slate-950">{integration.name}</div>
                          <div className="truncate text-sm text-slate-600">{integration.baseUrl}</div>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-sm text-slate-700 sm:justify-end">
                        <Badge variant="secondary" className="bg-white text-emerald-900">Connected</Badge>
                        <Badge variant="outline" className="bg-white">{integration.maskedOperatorKey}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {integrationStatus && (
              <div
                className={cn(
                  "rounded-xl border p-4 text-sm font-medium",
                  integrationStatus.includes("confirmed") ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-rose-200 bg-rose-50 text-rose-900",
                )}
              >
                {integrationStatus}
              </div>
            )}

            {selectedIntegration === "mirakl" ? (
              <Card className="rounded-xl shadow-sm">
                <form
                  onSubmit={(event) => {
                    event.preventDefault()
                    void confirmMiraklIntegration()
                  }}
                >
                  <CardHeader>
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex min-w-0 items-center gap-4">
                        <span className="flex size-24 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
                          <Image src="/logos/mirakl-config.png" alt="" width={400} height={400} className="size-full object-contain" />
                        </span>
                        <div className="min-w-0">
                          <CardTitle>MIRAKL connection</CardTitle>
                          <CardDescription>Confirm the operator endpoint with a read-only connectivity check.</CardDescription>
                        </div>
                      </div>
                      <Button type="button" variant="ghost" onClick={() => setSelectedIntegration(null)}>
                        <ArrowLeftIcon data-icon="inline-start" />
                        Back
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="grid gap-4 sm:grid-cols-2">
                    <label className="flex flex-col gap-2">
                      <span className="text-sm font-semibold text-slate-950">MIRAKL URL</span>
                      <TextInput
                        value={integrationForm.miraklBaseUrl}
                        onChange={(event) => updateIntegrationForm("miraklBaseUrl", event.target.value)}
                        placeholder="https://your-operator.mirakl.net"
                        aria-label="MIRAKL URL"
                      />
                    </label>
                    <label className="flex flex-col gap-2">
                      <span className="text-sm font-semibold text-slate-950">Operator key</span>
                      <TextInput
                        type="password"
                        value={integrationForm.operatorKey}
                        onChange={(event) => updateIntegrationForm("operatorKey", event.target.value)}
                        placeholder="Operator key"
                        aria-label="MIRAKL operator key"
                        autoComplete="off"
                      />
                    </label>
                  </CardContent>
                  <CardFooter className="flex justify-end">
                    <Button type="submit" disabled={checkingIntegration}>
                      {checkingIntegration ? <Loader2Icon className="size-4 animate-spin" /> : <CheckCircle2Icon data-icon="inline-start" />}
                      Confirm
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            ) : (
              <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {integrationProviders.map((provider) => (
                  <Card key={provider.id} className="flex rounded-xl shadow-sm">
                    <div className="flex min-h-full w-full flex-col">
                      <CardHeader className="gap-4">
                        <div className="flex h-16 items-center">
                          <Image src={provider.logoSrc} alt={`${provider.name} logo`} width={150} height={64} className="max-h-12 w-auto object-contain" />
                        </div>
                        <div>
                          <CardTitle>{provider.name}</CardTitle>
                          <CardDescription className="mt-1 leading-6">{provider.description}</CardDescription>
                        </div>
                      </CardHeader>
                      <CardFooter className="mt-auto">
                        {provider.id === "mirakl" ? (
                          <Button type="button" className="w-full" onClick={() => selectIntegration(provider)}>
                            Configure
                          </Button>
                        ) : (
                          <Button asChild type="button" variant="outline" className="w-full">
                            <a href={provider.href} onClick={(event) => event.preventDefault()} aria-label={`Configure ${provider.name}`}>
                              Configure
                            </a>
                          </Button>
                        )}
                      </CardFooter>
                    </div>
                  </Card>
                ))}
              </section>
            )}
          </div>
        </TabsContent>

        <TabsContent value="research" className="m-0">
          <div className="divide-y divide-slate-200/80">
            <FieldRow label="Research intake" description="Enable or pause whether reviewers can queue new product research jobs.">
              <CheckboxControl
                checked={settings.fakeResearchMode}
                onChange={(checked) => updateSetting("fakeResearchMode", checked)}
                label={settings.fakeResearchMode ? "Enabled" : "Paused"}
                description="When paused, no new Research Jobs are queued; jobs already queued or in flight still finish."
              />
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
