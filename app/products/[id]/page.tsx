import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeftIcon, ExternalLinkIcon } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { PageHeader, PageShell, MetricStrip, Panel } from "@/components/app/page-chrome"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CandidateActions } from "@/components/product/candidate-actions"
import { ExportPreviewPanel } from "@/components/product/export-preview-panel"
import { ResearchButton } from "@/components/product/research-button"
import { ScoreBadge } from "@/components/product/score-badge"
import { getFieldLabel } from "@/lib/demo-contract"
import type { ContractFieldId } from "@/lib/types"
import { cn } from "@/lib/utils"
import { buildReviewFieldRows } from "@/lib/product-review"
import { getProduct, getSchemaById } from "@/server/data"

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const product = await getProduct(id)

  if (!product) notFound()

  const schema = await getSchemaById(product.schemaId)
  const evidenceById = new Map(product.evidence.map((evidence) => [evidence.id, evidence]))
  const reviewRows = buildReviewFieldRows(product, schema)

  return (
    <PageShell>
      <div className="flex">
        <Button asChild variant="outline" size="sm">
          <Link href="/">
            <ArrowLeftIcon data-icon="inline-start" />
            Back to triage
          </Link>
        </Button>
      </div>

      <PageHeader
        eyebrow="Product review"
        title={product.title}
        description={`${product.categoryPath.join(" / ")} · compare the Mirakl baseline against staged evidence and approve only field-level candidates that make sense.`}
        badges={
          <>
            <Badge variant="outline">{product.miraklProductId}</Badge>
            <Badge variant="secondary">{schema?.name ?? product.schemaId}</Badge>
            <Badge variant="outline">{product.listingStatus}</Badge>
          </>
        }
        actions={<ResearchButton productId={product.id} />}
      />

      <MetricStrip
        metrics={[
          { label: "Quality", value: <ScoreBadge score={product.qualityScore} band={product.scoreBand} />, detail: "Current baseline readiness." },
          { label: "Candidates", value: product.candidates.length, detail: "Reviewable field changes.", tone: "success" },
          { label: "Evidence", value: product.evidence.length, detail: "Sources attached locally.", tone: "warning" },
          { label: "Warnings", value: product.warnings.length, detail: "Baseline issues still visible.", tone: product.warnings.length > 0 ? "danger" : "default" },
        ]}
      />

      {product.warnings.length > 0 && (
        <Alert variant="destructive">
          <AlertTitle>Baseline needs attention</AlertTitle>
          <AlertDescription>{product.warnings.join(" · ")}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="compare" className="flex flex-col gap-4">
        <TabsList className="w-fit max-w-full justify-start overflow-x-auto">
          <TabsTrigger value="compare">Compare</TabsTrigger>
          <TabsTrigger value="candidates">Candidates</TabsTrigger>
          <TabsTrigger value="evidence">Evidence</TabsTrigger>
          <TabsTrigger value="export">Export preview</TabsTrigger>
        </TabsList>

        <TabsContent value="compare">
          <Panel title="Baseline vs evidence vs candidate" description="Mirakl stays read-only until accepted candidate values are exported in a later approved workflow.">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Field</TableHead>
                  <TableHead>Mirakl baseline</TableHead>
                  <TableHead>Best evidence</TableHead>
                  <TableHead>Candidate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reviewRows.map((row) => (
                  <TableRow key={row.field} className={cn(row.baselineMissing && "bg-amber-500/10", row.hasCandidate && "border-l-4 border-l-primary/70")}>
                    <TableCell className="font-medium">
                      <div className="flex flex-col gap-2">
                        <span>{row.label}</span>
                        <div className="flex flex-wrap gap-2">
                          {row.baselineMissing && <Badge variant="outline">Baseline missing</Badge>}
                          {row.hasCandidate && <Badge variant="secondary">Candidate ready</Badge>}
                          {row.differsFromEvidence && <Badge variant="outline">Differs from evidence</Badge>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{row.baselineValue ?? <span className="text-muted-foreground">Missing</span>}</TableCell>
                    <TableCell>{row.evidenceValue ?? <span className="text-muted-foreground">—</span>}</TableCell>
                    <TableCell>{row.candidateValue ? <Badge variant="secondary">{row.candidateValue}</Badge> : <span className="text-muted-foreground">—</span>}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Panel>
        </TabsContent>

        <TabsContent value="candidates">
          <Panel title="Candidate decisions" description="Each candidate is a field-level decision, not another nested card. Accept, reject, or request more proof directly from the row.">
            <div className="divide-y rounded-xl border">
              {product.candidates.map((candidate) => (
                <div key={candidate.id} className="grid gap-4 p-4 lg:grid-cols-[12rem_1fr_1fr_18rem] lg:items-center">
                  <div className="flex flex-col gap-2">
                    <p className="font-semibold">{getFieldLabel(candidate.fieldName)}</p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">{candidate.confidence}</Badge>
                      <Badge variant="outline">{candidate.status}</Badge>
                    </div>
                  </div>
                  <div>
                    <p className="font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground">Current</p>
                    <p className="mt-1 text-sm">{candidate.currentValue ?? "Missing"}</p>
                  </div>
                  <div>
                    <p className="font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground">Candidate</p>
                    <p className="mt-1 font-semibold">{candidate.candidateValue}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {candidate.sourceEvidenceIds.map((evidenceId) => (
                        <Badge key={evidenceId} variant="outline">
                          {evidenceById.get(evidenceId)?.title ?? evidenceId}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <CandidateActions candidateId={candidate.id} />
                </div>
              ))}
            </div>
          </Panel>
        </TabsContent>

        <TabsContent value="evidence">
          <Panel title="Evidence sources" description="Source summaries are compact and scannable; extracted fields sit inline under each source.">
            <div className="divide-y rounded-xl border">
              {product.evidence.map((evidence) => (
                <div key={evidence.id} className="grid gap-4 p-4 xl:grid-cols-[18rem_1fr_18rem]">
                  <div>
                    <h3 className="font-semibold tracking-[-0.02em]">{evidence.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{evidence.sourceName}</p>
                    <Badge className="mt-3" variant="secondary">{evidence.confidence}</Badge>
                  </div>
                  <p className="text-sm leading-6">{evidence.summary}</p>
                  <div className="flex flex-col gap-3">
                    <div className="rounded-xl border bg-muted/35 p-3 text-xs">
                      {Object.entries(evidence.extractedFields).map(([field, value]) => (
                        <div key={field} className="flex justify-between gap-3 border-b py-1.5 last:border-b-0">
                          <span className="font-medium">{getFieldLabel(field as ContractFieldId)}</span>
                          <span className="text-right text-muted-foreground">{value}</span>
                        </div>
                      ))}
                    </div>
                    {evidence.sourceUrl && (
                      <Button asChild variant="outline" size="sm" className="w-fit">
                        <a href={evidence.sourceUrl}>
                          Open source
                          <ExternalLinkIcon data-icon="inline-end" />
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </TabsContent>

        <TabsContent value="export">
          <div className="flex flex-col gap-4">
            <Alert>
              <AlertTitle>Preview only</AlertTitle>
              <AlertDescription>Accepted candidates appear here as a draft export preview. No Mirakl submission is generated from this screen.</AlertDescription>
            </Alert>
            <Panel title="Draft export payload" description="Generate a local preview after accepting candidates. The payload is displayed as read-only JSON.">
              <ExportPreviewPanel productId={product.id} />
            </Panel>
          </div>
        </TabsContent>
      </Tabs>
    </PageShell>
  )
}
