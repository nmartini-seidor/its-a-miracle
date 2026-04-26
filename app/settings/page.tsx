import { Badge } from "@/components/ui/badge"
import { PageHeader, PageShell, MetricStrip, Panel } from "@/components/app/page-chrome"
import { ResetWorkspaceButton } from "@/components/settings/reset-workspace-button"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { listAggregators, listSchemas, getDemoSettings } from "@/server/data"

const governanceNotes = [
  "Operator approval is required before candidate values are exported.",
  "Evidence sources are ranked by authority and confidence policy.",
  "Schema matching defines the field-level review requirements for each category.",
]

function formatToggle(enabled: boolean) {
  return enabled ? "Enabled" : "Unavailable"
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
        title="Workspace settings"
        description="Inspect workspace configuration, governance policy, schema defaults, and research orchestration settings."
        badges={
          <>
            <Badge variant="secondary">Configured workflow</Badge>
            <Badge variant="outline">Operator controls</Badge>
          </>
        }
      />

      <MetricStrip
        metrics={[
          { label: "Workspace", value: "ACTIVE", detail: "Current operating environment." },
          { label: "Aggregators", value: enabledAggregators.length, detail: "Providers enabled in the workflow.", tone: "success" },
          { label: "Schemas", value: schemas.length, detail: "Category families configured." },
          { label: "Research delay", value: `${settings.defaultResearchDelaySeconds}s`, detail: "Job pacing for review workflows.", tone: "warning" },
        ]}
      />

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Panel title="Mirakl workspace mode" description="Connection metadata and export governance for the workspace.">
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
                  <TableCell>Configured endpoint</TableCell>
                  <TableCell><Badge variant="outline">Configured</Badge></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Environment</TableCell>
                  <TableCell>Primary</TableCell>
                  <TableCell><Badge variant="secondary">Active</Badge></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Submission mode</TableCell>
                  <TableCell>Review approval required</TableCell>
                  <TableCell><Badge variant="outline">Governed</Badge></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Secret handling</TableCell>
                  <TableCell>Managed by server configuration</TableCell>
                  <TableCell><Badge variant="outline">Protected</Badge></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Operator approval</TableCell>
                  <TableCell>Required before export</TableCell>
                  <TableCell><Badge variant="secondary">Mandatory</Badge></TableCell>
                </TableRow>
              </TableBody>
            </Table>
            <p className="text-sm leading-6 text-muted-foreground">Candidate values move through review, approval, and export preparation as separate workflow steps.</p>
          </div>
        </Panel>

        <Panel title="Governance notes" description="Controls that shape review and export behavior.">
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">Approval required</Badge>
              <Badge variant="secondary">Evidence ranked</Badge>
              <Badge variant="secondary">Schema governed</Badge>
            </div>
            <Separator />
            <div className="flex flex-col gap-3 text-sm leading-6 text-muted-foreground">
              {governanceNotes.map((rule) => <p key={rule}>• {rule}</p>)}
            </div>
            <Separator />
            <div className="flex flex-col gap-3">
              <p className="text-sm text-muted-foreground">Restore the workspace state and rerun the review flow.</p>
              <ResetWorkspaceButton />
            </div>
          </div>
        </Panel>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Research orchestration defaults" description="These settings shape the evidence pipeline and candidate creation cadence.">
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
                <TableCell>Research mode</TableCell>
                <TableCell>{formatToggle(settings.fakeResearchMode)}</TableCell>
                <TableCell>Research jobs collect evidence and candidate updates for review.</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Default job delay</TableCell>
                <TableCell>{settings.defaultResearchDelaySeconds} seconds</TableCell>
                <TableCell>Controls queued and running state timing before completion.</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Max evidence per product</TableCell>
                <TableCell>{settings.maxEvidencePerProduct}</TableCell>
                <TableCell>Caps supporting material presented per baseline.</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Default candidate confidence</TableCell>
                <TableCell>{formatConfidence(settings.defaultCandidateConfidence)}</TableCell>
                <TableCell>New candidates start from this confidence assumption.</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Export posture</TableCell>
                <TableCell>Accepted values only</TableCell>
                <TableCell>Only accepted candidate values are included in export payloads.</TableCell>
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
                  <TableCell>Headphones, smartphones, televisions, tablets, and laptops are configured.</TableCell>
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

      <Panel title="Aggregator trust policy" description="Enabled providers are ordered for evidence collection and review confidence.">
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
