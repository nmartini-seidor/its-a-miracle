import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
    <main className="mx-auto flex max-w-7xl flex-col gap-6 p-6">
      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">Local + mock only</Badge>
          <Badge variant="outline">Preview-safe controls</Badge>
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
          <p className="max-w-3xl text-muted-foreground">
            Review the demo workspace configuration that shapes Mirakl baseline handling, mock research behavior,
            schema assignment, and aggregator trust policy without touching any live integration.
          </p>
        </div>
      </section>

      <Alert>
        <AlertTitle>Read-only demo configuration</AlertTitle>
        <AlertDescription>
          Every value on this page is local to the preview environment. Operators can inspect the planned controls,
          but no credentials, Mirakl submissions, or provider-side mutations are executed from this route.
        </AlertDescription>
      </Alert>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader>
            <CardDescription>Mirakl environment</CardDescription>
            <CardTitle>{settings.environment.toUpperCase()}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">All exports remain draft-only and approval-gated.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Enabled aggregators</CardDescription>
            <CardTitle>{enabledAggregators.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Only configured mock providers participate in the demo narrative.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Schema families staged</CardDescription>
            <CardTitle>{schemas.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Category-driven assignment stays local to the workspace shell.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Research pacing</CardDescription>
            <CardTitle>{settings.defaultResearchDelaySeconds}s</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Mock jobs wait before surfacing evidence and candidate updates.</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Mirakl workspace mode</CardTitle>
            <CardDescription>Connection metadata is visible for operator confidence, but the demo keeps all live behaviors disabled.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
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
                  <TableCell>
                    <Badge variant="outline">Visible only</Badge>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Environment</TableCell>
                  <TableCell>{settings.environment}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">Demo sandbox</Badge>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Submission mode</TableCell>
                  <TableCell>No export file generation</TableCell>
                  <TableCell>
                    <Badge variant="outline">Disabled</Badge>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Credential handling</TableCell>
                  <TableCell>Not exposed in preview</TableCell>
                  <TableCell>
                    <Badge variant="outline">Server-only later</Badge>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Operator approval</TableCell>
                  <TableCell>Required before any export path</TableCell>
                  <TableCell>
                    <Badge variant="secondary">Mandatory</Badge>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
            <div className="flex flex-col gap-2 text-sm text-muted-foreground">
              <p>The page mirrors how a real workspace would stage environment settings without pretending that review decisions already leave the demo boundary.</p>
              <p>Actual Mirakl import/export submission remains intentionally deferred to a later, explicitly approved implementation phase.</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Preview guardrails</CardTitle>
            <CardDescription>These rules keep the settings surface credible while remaining safe for demos and reviews.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">No live writes</Badge>
              <Badge variant="secondary">No credential edits</Badge>
              <Badge variant="secondary">No provider calls</Badge>
            </div>
            <Separator />
            <div className="flex flex-col gap-3 text-sm text-muted-foreground">
              {previewGuardrails.map((rule) => (
                <p key={rule}>• {rule}</p>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Research orchestration defaults</CardTitle>
            <CardDescription>These controls shape the simulated evidence pipeline and candidate drafting cadence.</CardDescription>
          </CardHeader>
          <CardContent>
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
                  <TableCell>Gives operators time to see QUEUED and RUNNING states before completion.</TableCell>
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Schema governance defaults</CardTitle>
            <CardDescription>Schema matching and scoring stay visible so reviewers understand how the demo decides what to compare.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
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
              {schemas.map((schema) => (
                <Badge key={schema.id} variant="outline">
                  {schema.name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Aggregator trust policy</CardTitle>
          <CardDescription>Enabled providers are ordered for believable demo evidence collection without implying any live research integration.</CardDescription>
        </CardHeader>
        <CardContent>
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
                      <span className="font-medium">{aggregator.name}</span>
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
        </CardContent>
      </Card>
    </main>
  )
}
