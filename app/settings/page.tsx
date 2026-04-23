import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { PageHeader, PageShell, MetricStrip, Panel } from "@/components/app/page-chrome"
import { ResetDemoButton } from "@/components/settings/reset-demo-button"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { listAggregators, listSchemas, getDemoSettings } from "@/server/data"

const previewGuardrails = [
  "Mirakl writes stay disabled until a later export workflow is explicitly approved.",
  "Research remains simulated locally; no external provider calls or credential mutations happen here.",
  "Schema and aggregator preferences shape the demo narrative only; they do not sync upstream systems.",
]

function formatToggle(enabled: boolean) {
  return enabled ? "Enabled" : "Disabled"
}

function formatConfidence(confidence: string) {
  return confidence.charAt(0).toUpperCase() + confidence.slice(1)
}

export default async function SettingsPage() {
  const [settings, schemas, aggregators] = await Promise.all([getDemoSettings(), listSchemas(), listAggregators()])
  const enabledAggregators = aggregators.filter((aggregator) => settings.enabledAggregatorIds.includes(aggregator.id))

  return (
    <PageShell>
      <PageHeader
        eyebrow="Settings"
        title="Controls, not confusion."
        description="The workspace configuration is preview-safe, local, and explicit about what cannot happen from this demo environment."
        badges={
          <>
            <Badge variant="secondary">Local + mock only</Badge>
            <Badge variant="outline">Preview-safe controls</Badge>
          </>
        }
      />

      <Alert>
        <AlertTitle>Read-only demo configuration</AlertTitle>
        <AlertDescription>
          Every value on this page is local to the preview environment. Operators can inspect planned controls, but no credentials, Mirakl submissions, or provider-side mutations are executed from this route.
        </AlertDescription>
      </Alert>

      <MetricStrip
        metrics={[
          { label: "Environment", value: settings.environment.toUpperCase(), detail: "All exports remain draft-only." },
          { label: "Aggregators", value: enabledAggregators.length, detail: "Mock providers enabled in the demo.", tone: "success" },
          { label: "Schemas", value: schemas.length, detail: "Category families staged locally." },
          { label: "Research delay", value: `${settings.defaultResearchDelaySeconds}s`, detail: "Mock job pacing for walkthroughs.", tone: "warning" },
        ]}
      />

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Panel title="Mirakl workspace mode" description="Connection metadata is visible for operator confidence, while every live behavior remains disabled.">
          <div className="flex flex-col gap-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Setting</TableHead>
                  <TableHead>Current value</TableHead>
                  <TableHead>Execution posture</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>Mirakl base URL</TableCell>
                  <TableCell className="font-mono text-xs">{settings.miraklBaseUrl}</TableCell>
                  <TableCell><Badge variant="outline">Visible only</Badge></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Environment</TableCell>
                  <TableCell>{settings.environment}</TableCell>
                  <TableCell><Badge variant="secondary">Demo sandbox</Badge></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Submission mode</TableCell>
                  <TableCell>No export file generation</TableCell>
                  <TableCell><Badge variant="outline">Disabled</Badge></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Credential handling</TableCell>
                  <TableCell>Not exposed in preview</TableCell>
                  <TableCell><Badge variant="outline">Server-only later</Badge></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Operator approval</TableCell>
                  <TableCell>Required before any export path</TableCell>
                  <TableCell><Badge variant="secondary">Mandatory</Badge></TableCell>
                </TableRow>
              </TableBody>
            </Table>
            <p className="text-sm leading-6 text-muted-foreground">Actual Mirakl import/export submission remains intentionally deferred to a later, explicitly approved implementation phase.</p>
          </div>
        </Panel>

        <Panel title="Preview guardrails" description="Plain-language boundaries keep the settings page credible during demos and reviews.">
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">No live writes</Badge>
              <Badge variant="secondary">No credential edits</Badge>
              <Badge variant="secondary">No provider calls</Badge>
            </div>
            <Separator />
            <div className="flex flex-col gap-3 text-sm leading-6 text-muted-foreground">
              {previewGuardrails.map((rule) => <p key={rule}>• {rule}</p>)}
            </div>
            <Separator />
            <div className="flex flex-col gap-3">
              <p className="text-sm text-muted-foreground">Replay the seeded walkthrough state and clear prior review decisions or mock research runs.</p>
              <ResetDemoButton />
              <p className="text-xs text-muted-foreground">Terminal equivalent: <code className="rounded bg-muted px-1 py-0.5">npm run reset:demo</code></p>
            </div>
          </div>
        </Panel>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Research orchestration defaults" description="These settings shape the simulated evidence pipeline and candidate drafting cadence.">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Control</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Meaning</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>Fake research mode</TableCell>
                <TableCell>{formatToggle(settings.fakeResearchMode)}</TableCell>
                <TableCell>Research jobs stay local and deterministic for demo walkthroughs.</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Default job delay</TableCell>
                <TableCell>{settings.defaultResearchDelaySeconds} seconds</TableCell>
                <TableCell>Gives operators time to see queued and running states before completion.</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Max evidence per product</TableCell>
                <TableCell>{settings.maxEvidencePerProduct}</TableCell>
                <TableCell>Caps how much supporting material the preview presents per baseline.</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Default candidate confidence</TableCell>
                <TableCell>{formatConfidence(settings.defaultCandidateConfidence)}</TableCell>
                <TableCell>Newly drafted candidates start from a moderate confidence assumption.</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Export posture</TableCell>
                <TableCell>Draft preview only</TableCell>
                <TableCell>Only accepted values can appear, and only in a non-submittable preview.</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Panel>

        <Panel title="Schema governance defaults" description="Schema matching and scoring stay visible so reviewers understand how comparison rules are chosen.">
          <div className="flex flex-col gap-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Policy</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>Auto-assign schema by category</TableCell>
                  <TableCell>{formatToggle(settings.autoAssignSchemaByCategory)}</TableCell>
                  <TableCell>Category paths can pre-select a schema family before review begins.</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Schema families available</TableCell>
                  <TableCell>{schemas.length}</TableCell>
                  <TableCell>Headphones, smartphones, televisions, tablets, and laptops are already staged.</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Operator outcome</TableCell>
                  <TableCell>Review-ready comparisons</TableCell>
                  <TableCell>Required fields surface first so baseline gaps are easy to spot.</TableCell>
                </TableRow>
              </TableBody>
            </Table>
            <Separator />
            <div className="flex flex-wrap gap-2">
              {schemas.map((schema) => <Badge key={schema.id} variant="outline">{schema.name}</Badge>)}
            </div>
          </div>
        </Panel>
      </div>

      <Panel title="Aggregator trust policy" description="Enabled providers are ordered for believable demo evidence collection without implying any live research integration.">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Provider</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Authority</TableHead>
              <TableHead>Default confidence</TableHead>
              <TableHead>Coverage</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {enabledAggregators.map((aggregator) => (
              <TableRow key={aggregator.id}>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <span className="font-semibold">{aggregator.name}</span>
                    <span className="text-xs text-muted-foreground">{aggregator.description}</span>
                  </div>
                </TableCell>
                <TableCell>{aggregator.type.replaceAll("_", " ")}</TableCell>
                <TableCell>{aggregator.authorityScore}/100</TableCell>
                <TableCell>{formatConfidence(aggregator.defaultConfidence)}</TableCell>
                <TableCell>{aggregator.coverageTags.join(", ")}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Panel>
    </PageShell>
  )
}
