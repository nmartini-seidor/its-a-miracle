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
import { getProduct } from "@/server/data"

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const product = await getProduct(id)
  if (!product) notFound()
  const evidenceById = new Map(product.evidence.map((evidence) => [evidence.id, evidence]))
  const fields = Array.from(new Set([...Object.keys(product.attributes), ...Object.keys(product.orangeAttributes), ...product.candidates.map((candidate) => candidate.fieldPath)]))
  return (
    <main className="mx-auto flex max-w-7xl flex-col gap-6 p-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <Button asChild variant="ghost" size="sm" className="w-fit"><Link href="/">← Back</Link></Button>
          <h1 className="text-3xl font-semibold tracking-tight">{product.title}</h1>
          <p className="text-muted-foreground">{product.categoryPath.join(" / ")} · {product.sourceSku}</p>
        </div>
        <ResearchButton productId={product.id} />
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardHeader><CardTitle>{product.score}/100</CardTitle><CardDescription>Quality score</CardDescription></CardHeader></Card>
        <Card><CardHeader><CardTitle>{product.candidates.length}</CardTitle><CardDescription>Candidates</CardDescription></CardHeader></Card>
        <Card><CardHeader><CardTitle>{product.evidence.length}</CardTitle><CardDescription>Evidence sources</CardDescription></CardHeader></Card>
        <Card><CardHeader><CardTitle>{product.warnings.length}</CardTitle><CardDescription>Baseline warnings</CardDescription></CardHeader></Card>
      </div>
      {product.warnings.length > 0 && <Alert variant="destructive"><AlertTitle>Baseline needs attention</AlertTitle><AlertDescription>{product.warnings.join(" · ")}</AlertDescription></Alert>}
      <Tabs defaultValue="compare" className="flex flex-col gap-4">
        <TabsList className="w-fit"><TabsTrigger value="compare">Compare</TabsTrigger><TabsTrigger value="candidates">Candidates</TabsTrigger><TabsTrigger value="evidence">Evidence</TabsTrigger><TabsTrigger value="export">Export preview</TabsTrigger></TabsList>
        <TabsContent value="compare"><Card><CardHeader><CardTitle>Baseline vs source vs candidate</CardTitle><CardDescription>Mirakl remains unchanged until candidates are approved and exported.</CardDescription></CardHeader><CardContent><Table><TableHeader><TableRow><TableHead>Field</TableHead><TableHead>Mirakl baseline</TableHead><TableHead>Orange source</TableHead><TableHead>Candidate</TableHead></TableRow></TableHeader><TableBody>{fields.map((field) => { const candidate = product.candidates.find((item) => item.fieldPath === field); return <TableRow key={field}><TableCell className="font-medium">{field}</TableCell><TableCell>{product.attributes[field] ?? <span className="text-muted-foreground">Missing</span>}</TableCell><TableCell>{product.orangeAttributes[field] ?? <span className="text-muted-foreground">—</span>}</TableCell><TableCell>{candidate ? <Badge variant="secondary">{candidate.candidateValue}</Badge> : <span className="text-muted-foreground">—</span>}</TableCell></TableRow> })}</TableBody></Table></CardContent></Card></TabsContent>
        <TabsContent value="candidates"><div className="grid gap-4">{product.candidates.map((candidate) => <Card key={candidate.id}><CardHeader><CardTitle>{candidate.fieldPath}</CardTitle><CardDescription>{candidate.confidence} confidence · {candidate.status}</CardDescription></CardHeader><CardContent className="flex flex-col gap-3"><div className="grid gap-3 md:grid-cols-2"><div><p className="text-sm text-muted-foreground">Current</p><p>{candidate.currentValue ?? "Missing"}</p></div><div><p className="text-sm text-muted-foreground">Candidate</p><p>{candidate.candidateValue}</p></div></div><Separator /><div className="flex flex-wrap gap-2">{candidate.evidenceIds.map((evidenceId) => <Badge key={evidenceId} variant="outline">{evidenceById.get(evidenceId)?.title ?? evidenceId}</Badge>)}</div><CandidateActions candidateId={candidate.id} /></CardContent></Card>)}</div></TabsContent>
        <TabsContent value="evidence"><div className="grid gap-4 md:grid-cols-2">{product.evidence.map((evidence) => <Card key={evidence.id}><CardHeader><CardTitle>{evidence.title}</CardTitle><CardDescription>{evidence.sourceType} · {evidence.confidence}</CardDescription></CardHeader><CardContent><p className="text-sm">{evidence.excerpt}</p>{evidence.url && <Button asChild variant="link" className="px-0"><a href={evidence.url}>Open source</a></Button>}</CardContent></Card>)}</div></TabsContent>
        <TabsContent value="export"><div className="flex flex-col gap-4"><Alert><AlertTitle>Preview only</AlertTitle><AlertDescription>Accepted candidates will appear here as an export preview. Mirakl submission remains approval-gated.</AlertDescription></Alert><ExportPreviewPanel productId={product.id} /></div></TabsContent>
      </Tabs>
    </main>
  )
}
