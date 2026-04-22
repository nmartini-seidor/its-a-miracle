import Link from "next/link"
import { notFound } from "next/navigation"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
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
    <main className="mx-auto flex max-w-7xl flex-col gap-6 p-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-3">
          <Button asChild variant="ghost" size="sm" className="w-fit">
            <Link href="/">← Back</Link>
          </Button>
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">{product.miraklProductId}</Badge>
              <Badge variant="secondary">{schema?.name ?? product.schemaId}</Badge>
              <Badge variant="outline">{product.listingStatus}</Badge>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight">{product.title}</h1>
            <p className="text-muted-foreground">{product.categoryPath.join(" / ")}</p>
          </div>
        </div>
        <ResearchButton productId={product.id} />
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>
              <ScoreBadge score={product.qualityScore} band={product.scoreBand} />
            </CardTitle>
            <CardDescription>Quality score</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{product.candidates.length}</CardTitle>
            <CardDescription>Candidates</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{product.evidence.length}</CardTitle>
            <CardDescription>Evidence sources</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{product.warnings.length}</CardTitle>
            <CardDescription>Baseline warnings</CardDescription>
          </CardHeader>
        </Card>
      </div>
      {product.warnings.length > 0 && (
        <Alert variant="destructive">
          <AlertTitle>Baseline needs attention</AlertTitle>
          <AlertDescription>{product.warnings.join(" · ")}</AlertDescription>
        </Alert>
      )}
      <Tabs defaultValue="compare" className="flex flex-col gap-4">
        <TabsList className="w-fit">
          <TabsTrigger value="compare">Compare</TabsTrigger>
          <TabsTrigger value="candidates">Candidates</TabsTrigger>
          <TabsTrigger value="evidence">Evidence</TabsTrigger>
          <TabsTrigger value="export">Export preview</TabsTrigger>
        </TabsList>
        <TabsContent value="compare">
          <Card>
            <CardHeader>
              <CardTitle>Baseline vs evidence vs candidate</CardTitle>
              <CardDescription>Mirakl stays read-only until approved candidate values are exported later.</CardDescription>
            </CardHeader>
            <CardContent>
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
                    <TableRow key={row.field} className={cn(row.baselineMissing && "bg-amber-50/70", row.hasCandidate && "border-l-4 border-l-primary/50")}>
                      <TableCell className="font-medium">
                        <div className="flex flex-col gap-2">
                          <span>{row.label}</span>
                          <div className="flex flex-wrap gap-2">
                            {row.baselineMissing && <Badge variant="outline">Baseline missing</Badge>}
                            {row.hasCandidate && <Badge variant="secondary">Candidate ready</Badge>}
                            {row.differsFromEvidence && <Badge variant="outline">Candidate differs from best evidence</Badge>}
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
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="candidates">
          <div className="grid gap-4">
            {product.candidates.map((candidate) => (
              <Card key={candidate.id}>
                <CardHeader>
                  <CardTitle>{getFieldLabel(candidate.fieldName)}</CardTitle>
                  <CardDescription>
                    {candidate.confidence} confidence · {candidate.status}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <p className="text-sm text-muted-foreground">Current</p>
                      <p>{candidate.currentValue ?? "Missing"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Candidate</p>
                      <p>{candidate.candidateValue}</p>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex flex-wrap gap-2">
                    {candidate.sourceEvidenceIds.map((evidenceId) => (
                      <Badge key={evidenceId} variant="outline">
                        {evidenceById.get(evidenceId)?.title ?? evidenceId}
                      </Badge>
                    ))}
                  </div>
                  <CandidateActions candidateId={candidate.id} />
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="evidence">
          <div className="grid gap-4 md:grid-cols-2">
            {product.evidence.map((evidence) => (
              <Card key={evidence.id}>
                <CardHeader>
                  <CardTitle>{evidence.title}</CardTitle>
                  <CardDescription>
                    {evidence.sourceName} · {evidence.confidence}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  <p className="text-sm">{evidence.summary}</p>
                  <div className="rounded-md border bg-muted/40 p-3 text-xs">
                    {Object.entries(evidence.extractedFields).map(([field, value]) => (
                      <div key={field} className="flex justify-between gap-3 border-b py-1 last:border-b-0">
                        <span className="font-medium">{getFieldLabel(field as ContractFieldId)}</span>
                        <span className="text-right text-muted-foreground">{value}</span>
                      </div>
                    ))}
                  </div>
                  {evidence.sourceUrl && (
                    <Button asChild variant="link" className="px-0">
                      <a href={evidence.sourceUrl}>Open source</a>
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="export">
          <div className="flex flex-col gap-4">
            <Alert>
              <AlertTitle>Preview only</AlertTitle>
              <AlertDescription>Accepted candidates appear here as a draft export preview. No Mirakl submission is generated from this screen.</AlertDescription>
            </Alert>
            <ExportPreviewPanel productId={product.id} />
          </div>
        </TabsContent>
      </Tabs>
    </main>
  )
}
