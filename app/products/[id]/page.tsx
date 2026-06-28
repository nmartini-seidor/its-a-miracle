import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeftIcon, BotIcon, CheckCircle2Icon, ExternalLinkIcon, FileSearchIcon, GitCompareArrowsIcon, ListChecksIcon, SparklesIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { PageHeader, PageShell, MetricStrip, Panel } from "@/components/app/page-chrome"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CandidateActions } from "@/components/product/candidate-actions"
import { ExportPayloadPanel } from "@/components/product/export-payload-panel"
import { ResearchButton } from "@/components/product/research-button"
import { ScoreBadge } from "@/components/product/score-badge"
import { SyncMiraklButton } from "@/components/product/sync-mirakl-button"
import { getFieldLabel } from "@/lib/demo-contract"
import { formatEnumLabel } from "@/lib/labels"
import type { ContractFieldId, EvidenceRecord } from "@/lib/types"
import { buildReviewFieldRows, getCompetingCandidatesByField, isFieldConflicted } from "@/lib/product-review"
import { cn } from "@/lib/utils"
import { getDemoSettings, getProduct, getSchemaById } from "@/server/data"

const RUNNER_LABELS: Record<string, string> = { cursor: "Cursor", codex: "Codex", claude: "Claude" }

function confidenceClass(confidence: "high" | "medium" | "low") {
  if (confidence === "high") return "bg-emerald-50 text-emerald-800 ring-emerald-200"
  if (confidence === "medium") return "bg-amber-50 text-amber-800 ring-amber-200"
  return "bg-slate-100 text-slate-700 ring-slate-200"
}

function isAiTranslation(reason: string | null | undefined) {
  return /AI translation/i.test(reason ?? "")
}

function latestEvidenceBySource(evidence: EvidenceRecord[]) {
  return [...evidence].reverse().filter((record, index, records) =>
    records.findIndex((item) => item.aggregatorId === record.aggregatorId) === index,
  ).reverse()
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const product = await getProduct(id)

  if (!product) notFound()

  const [schema, settings] = await Promise.all([getSchemaById(product.schemaId), getDemoSettings()])
  const evidenceById = new Map(product.evidence.map((evidence) => [evidence.id, evidence]))
  const reviewRows = buildReviewFieldRows(product, schema)
  // Group every in-play candidate by field so competing values from different runners surface as a
  // Conflict for review (ADR 0004), ordered by the review-field order.
  const competingByField = getCompetingCandidatesByField(product)
  const conflictFieldGroups = reviewRows
    .map((row) => ({ field: row.field, label: row.label, candidates: competingByField.get(row.field) ?? [] }))
    .filter((group) => group.candidates.length > 0)
  const displayCandidates = conflictFieldGroups.flatMap((group) => group.candidates)
  const evidenceSources = latestEvidenceBySource(product.evidence)
  const proposedCandidateIds = displayCandidates.filter((candidate) => candidate.status === "proposed").map((candidate) => candidate.id)
  const acceptedCandidateIds = displayCandidates.filter((candidate) => candidate.status === "accepted").map((candidate) => candidate.id)
  const attentionRows = reviewRows.filter((row) => row.baselineNeedsAttention)

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
        description={product.categoryPath.join(" / ")}
        badges={
          <>
            <Badge variant="outline">{product.miraklProductId}</Badge>
            <Badge variant="secondary">{schema?.name ?? product.schemaId}</Badge>
            <Badge variant="outline">{formatEnumLabel(product.listingStatus)}</Badge>
          </>
        }
        actions={
          <div className="flex flex-wrap items-start justify-end gap-2">
            <ResearchButton productId={product.id} researchPaused={!settings.fakeResearchMode} />
            <SyncMiraklButton productId={product.id} canSync={acceptedCandidateIds.length > 0} />
          </div>
        }
      />

      <MetricStrip
        metrics={[
          {
            label: "Quality",
            value: <ScoreBadge score={product.qualityScore} band={product.scoreBand} />,
            detail: "Current baseline readiness.",
            accessory: acceptedCandidateIds.length > 0 ? (
              <span className="inline-flex animate-pulse items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[0.68rem] font-bold uppercase leading-none text-amber-800 shadow-[0_0_14px_rgba(245,158,11,0.24)]">
                <SparklesIcon className="size-3" aria-hidden="true" />
                Sync
              </span>
            ) : undefined,
          },
          { label: "Candidates", value: displayCandidates.length, detail: "Reviewable field changes.", tone: "success" },
          { label: "Evidence", value: evidenceSources.length, detail: "Sources attached to this product.", tone: "warning" },
          { label: "Warnings", value: attentionRows.length, detail: "Rows needing attention.", tone: attentionRows.length > 0 ? "danger" : "default" },
        ]}
      />

      <Tabs defaultValue="compare" className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <TabsList className="w-fit max-w-full justify-start gap-1 overflow-x-auto rounded-lg border border-slate-200 bg-slate-100 p-1 shadow-none">
            <TabsTrigger value="compare" className="h-8 gap-2 rounded-md px-3 text-sm font-semibold text-slate-600 shadow-none data-[state=active]:bg-white data-[state=active]:text-slate-950 data-[state=active]:shadow-sm"><GitCompareArrowsIcon data-icon="inline-start" aria-hidden="true" />Compare</TabsTrigger>
            <TabsTrigger value="candidates" className="h-8 gap-2 rounded-md px-3 text-sm font-semibold text-slate-600 shadow-none data-[state=active]:bg-white data-[state=active]:text-slate-950 data-[state=active]:shadow-sm"><ListChecksIcon data-icon="inline-start" aria-hidden="true" />Candidates</TabsTrigger>
            <TabsTrigger value="evidence" className="h-8 gap-2 rounded-md px-3 text-sm font-semibold text-slate-600 shadow-none data-[state=active]:bg-white data-[state=active]:text-slate-950 data-[state=active]:shadow-sm"><FileSearchIcon data-icon="inline-start" aria-hidden="true" />Evidence</TabsTrigger>
          </TabsList>
          <ExportPayloadPanel productId={product.id} proposedCandidateIds={proposedCandidateIds} acceptedCandidateIds={acceptedCandidateIds} />
        </div>

        <TabsContent value="compare">
          <Panel title="Product data comparison" description="Review Mirakl values against the candidate value and supporting evidence sources." headerClassName="bg-white" bodyClassName="p-0 sm:p-0">
            <Table surface="flush">
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
                  <TableRow key={row.field} className={cn(row.baselineNeedsAttention && "bg-rose-50/70 hover:bg-rose-50")}>
                    <TableCell className={cn("min-w-48 font-semibold text-foreground", row.baselineNeedsAttention && "text-rose-950")}>
                      <div className="flex flex-col gap-1">
                        <span className="flex flex-wrap items-center gap-2">
                          {row.label}
                        </span>
                        {row.baselineNeedsAttention && <span className="text-xs font-medium text-rose-700">Needs attention</span>}
                      </div>
                    </TableCell>
                    <TableCell className={cn("min-w-56 bg-sky-50/80 text-sky-950 shadow-[inset_4px_0_0_rgba(37,99,235,0.38)]", row.baselineNeedsAttention && "bg-rose-100/80 text-rose-950 shadow-[inset_4px_0_0_rgba(225,29,72,0.55)]")}>
                      {row.baselineValue ? (
                        <span
                          className={cn(
                            row.baselineProjected && "inline-flex items-center gap-2 rounded-lg bg-emerald-50 px-2.5 py-1 text-sm font-semibold text-emerald-900 ring-1 ring-emerald-200",
                          )}
                        >
                          {row.baselineProjected && <CheckCircle2Icon className="size-4 text-emerald-600" aria-label="Approved Mirakl value" />}
                          {row.baselineValue}
                        </span>
                      ) : <Badge variant="outline">Missing</Badge>}
                    </TableCell>
                    <TableCell className="min-w-56">
                      {row.candidateValue ? (
                        <span className="inline-flex items-center gap-2 rounded-lg bg-emerald-50 px-2.5 py-1 text-sm font-semibold text-emerald-900 ring-1 ring-emerald-200">
                          {row.candidateStatus === "accepted" && <CheckCircle2Icon className="size-4 text-emerald-600" aria-label="Accepted candidate" />}
                          {row.candidateValue}
                          {isAiTranslation(row.candidateReason) && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-violet-50 px-1.5 py-0.5 text-[0.68rem] font-bold uppercase tracking-[0.12em] text-violet-700 ring-1 ring-violet-200">
                              <SparklesIcon className="size-3" aria-hidden="true" />
                              AI translation
                            </span>
                          )}
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
          <Panel bodyClassName="p-0 sm:p-0">
            <div className="divide-y divide-slate-200">
              {conflictFieldGroups.map((group) => {
                const conflicted = isFieldConflicted(group.candidates)
                return (
                  <div key={group.field} className="flex flex-col gap-3 p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{group.label}</p>
                      {conflicted ? (
                        <Badge variant="outline" className="bg-amber-50 text-amber-800 ring-1 ring-amber-200">
                          <GitCompareArrowsIcon data-icon="inline-start" aria-hidden="true" />
                          Conflict · {group.candidates.length} competing values
                        </Badge>
                      ) : (group.candidates[0]?.runners?.length ?? 0) >= 2 ? (
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200">
                          <CheckCircle2Icon data-icon="inline-start" aria-hidden="true" />
                          Consensus · {group.candidates[0].runners?.length} runners
                        </Badge>
                      ) : null}
                    </div>
                    {group.candidates.map((candidate) => (
                      <div key={candidate.id} className="grid gap-3 rounded-xl border border-slate-100 p-3 lg:grid-cols-[1fr_16rem] lg:items-center">
                        <div className="flex flex-col gap-2">
                          <div className="flex flex-wrap items-center gap-2 font-semibold">
                            {candidate.candidateValue}
                            <Badge variant="outline" className={cn("capitalize", confidenceClass(candidate.confidence))}>{candidate.confidence}</Badge>
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5">
                            {(candidate.runners ?? (candidate.runner ? [candidate.runner] : [])).map((runner) => (
                              <Badge key={runner} variant="outline" className="bg-slate-50 text-[0.65rem] font-semibold uppercase tracking-wide text-slate-600">
                                <BotIcon data-icon="inline-start" aria-hidden="true" />
                                {RUNNER_LABELS[runner] ?? runner}
                              </Badge>
                            ))}
                            {candidate.sourceEvidenceIds.map((evidenceId) => {
                              const evidence = evidenceById.get(evidenceId)
                              if (!evidence?.sourceUrl) return <Badge key={evidenceId} variant="outline">{evidence?.sourceName ?? evidenceId}</Badge>
                              return (
                                <a
                                  key={evidenceId}
                                  href={evidence.sourceUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className={cn("inline-flex rounded-lg border px-2.5 py-0.5 text-xs font-semibold transition-colors hover:bg-slate-50", confidenceClass(evidence.confidence))}
                                >
                                  {evidence.sourceName}
                                </a>
                              )
                            })}
                          </div>
                        </div>
                        <CandidateActions candidateId={candidate.id} status={candidate.status} />
                      </div>
                    ))}
                  </div>
                )
              })}
              {conflictFieldGroups.length === 0 && (
                <p className="p-8 text-center text-sm text-slate-500">No candidate values yet. Run the research agents to gather sourced proposals.</p>
              )}
            </div>
          </Panel>
        </TabsContent>

        <TabsContent value="evidence">
          <Panel bodyClassName="p-0 sm:p-0">
            <div className="divide-y divide-slate-200">
              {evidenceSources.map((evidence) => (
                <div key={evidence.id} className="grid gap-4 p-4 xl:grid-cols-[18rem_1fr_18rem]">
                  <div>
                    <h3 className="font-semibold tracking-[-0.02em]">{evidence.sourceName}</h3>
                    <Badge className={cn("mt-3 capitalize ring-1", confidenceClass(evidence.confidence))} variant="outline">{evidence.confidence}</Badge>
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
                        <a href={evidence.sourceUrl} target="_blank" rel="noreferrer">
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

      </Tabs>
    </PageShell>
  )
}
