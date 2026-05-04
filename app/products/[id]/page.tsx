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
import { ExportPayloadPanel } from "@/components/product/export-payload-panel"
import { ResearchButton } from "@/components/product/research-button"
import { ScoreBadge } from "@/components/product/score-badge"
import { getFieldLabel } from "@/lib/demo-contract"
import { formatEnumLabel } from "@/lib/labels"
import type { ContractFieldId } from "@/lib/types"
import { buildReviewFieldRows } from "@/lib/product-review"
import { getProduct, getSchemaById } from "@/server/data"

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const product = await getProduct(id)

  if (!product) notFound()

  const schema = await getSchemaById(product.schemaId)
  const evidenceById = new Map(product.evidence.map((evidence) => [evidence.id, evidence]))
  const reviewRows = buildReviewFieldRows(product, schema)
  const evidenceSources = product.evidence.filter((evidence, index, records) =>
    records.findIndex((item) => item.aggregatorId === evidence.aggregatorId) === index,
  )

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
        description={`${product.categoryPath.join(" / ")} · compare Mirakl data against evidence sources and approve only field-level candidates that make sense.`}
        badges={
          <>
            <Badge variant="outline">{product.miraklProductId}</Badge>
            <Badge variant="secondary">{schema?.name ?? product.schemaId}</Badge>
            <Badge variant="outline">{formatEnumLabel(product.listingStatus)}</Badge>
          </>
        }
        actions={<ResearchButton productId={product.id} />}
      />

      <MetricStrip
        metrics={[
          { label: "Quality", value: <ScoreBadge score={product.qualityScore} band={product.scoreBand} />, detail: "Current baseline readiness." },
          { label: "Candidates", value: product.candidates.length, detail: "Reviewable field changes.", tone: "success" },
          { label: "Evidence", value: product.evidence.length, detail: "Sources attached to this product.", tone: "warning" },
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
          <TabsTrigger value="export">Export</TabsTrigger>
        </TabsList>

        <TabsContent value="compare">
          <Panel title="Product data comparison" description="Review Mirakl values against the candidate value and supporting evidence sources.">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-48">Attribute name</TableHead>
                  <TableHead className="bg-sky-100/90 text-sky-950 shadow-[inset_4px_0_0_#2563eb]">MIRAKL</TableHead>
                  <TableHead>Candidate</TableHead>
                  {evidenceSources.map((source) => (
                    <TableHead key={source.aggregatorId}>{source.sourceName}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {reviewRows.map((row) => (
                  <TableRow key={row.field}>
                    <TableCell className="min-w-48 font-semibold text-foreground">
                      {row.label}
                    </TableCell>
                    <TableCell className="min-w-56 bg-sky-50/80 text-sky-950 shadow-[inset_4px_0_0_rgba(37,99,235,0.38)]">
                      {row.baselineValue ? <span>{row.baselineValue}</span> : <Badge variant="outline">Missing</Badge>}
                    </TableCell>
                    <TableCell className="min-w-56">
                      {row.candidateValue ? (
                        <span className="inline-flex rounded-lg bg-emerald-50 px-2.5 py-1 text-sm font-semibold text-emerald-900 ring-1 ring-emerald-200">
                          {row.candidateValue}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    {evidenceSources.map((source) => {
                      const value = source.extractedFields[row.field]
                      return (
                        <TableCell key={`${row.field}-${source.aggregatorId}`} className="min-w-56">
                          {value ?? <span className="text-muted-foreground">—</span>}
                        </TableCell>
                      )
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Panel>
        </TabsContent>

        <TabsContent value="candidates">
          <Panel title="Candidate decisions" description="Each candidate is a field-level decision, not another nested card. Accept, reject, or request more proof directly from the row.">
            <div className="divide-y divide-slate-200 overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200">
              {product.candidates.map((candidate) => (
                <div key={candidate.id} className="grid gap-4 p-4 lg:grid-cols-[12rem_1fr_1fr_18rem] lg:items-center">
                  <div className="flex flex-col gap-2">
                    <p className="font-semibold">{getFieldLabel(candidate.fieldName)}</p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">{candidate.confidence}</Badge>
                      <Badge variant="outline">{formatEnumLabel(candidate.status)}</Badge>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500">Current</p>
                    <p className="mt-1 text-sm">{candidate.currentValue ?? "Missing"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500">Candidate</p>
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
            <div className="divide-y divide-slate-200 overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200">
              {product.evidence.map((evidence) => (
                <div key={evidence.id} className="grid gap-4 p-4 xl:grid-cols-[18rem_1fr_18rem]">
                  <div>
                    <h3 className="font-semibold tracking-[-0.02em]">{evidence.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{evidence.sourceName}</p>
                    <Badge className="mt-3" variant="secondary">{formatEnumLabel(evidence.confidence)}</Badge>
                  </div>
                  <p className="text-sm leading-6">{evidence.summary}</p>
                  <div className="flex flex-col gap-3">
                    <div className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-100 text-xs">
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
            <Panel title="Export payload" description="Generate the export payload after accepting candidates. The payload is displayed as JSON.">
              <ExportPayloadPanel productId={product.id} />
            </Panel>
          </div>
        </TabsContent>
      </Tabs>
    </PageShell>
  )
}
