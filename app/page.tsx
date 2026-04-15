import Link from "next/link"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { listProducts } from "@/server/data"

export default async function DashboardPage() {
  const products = await listProducts()
  return (
    <main className="mx-auto flex max-w-7xl flex-col gap-6 p-6">
      <section className="flex flex-col gap-3">
        <Badge variant="secondary" className="w-fit">Mirakl baseline + evidence candidates</Badge>
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight">Product enrichment dashboard</h1>
          <p className="max-w-3xl text-muted-foreground">Review noisy Mirakl records, compare them with Orange source data, launch bounded research jobs, and approve field-level improvements before any Mirakl export.</p>
        </div>
      </section>
      <Alert>
        <AlertTitle>Write safety</AlertTitle>
        <AlertDescription>This prototype is preview-only. Research jobs create candidates and evidence; they do not mutate Mirakl.</AlertDescription>
      </Alert>
      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardHeader><CardTitle>{products.length}</CardTitle><CardDescription>Products in current fixture</CardDescription></CardHeader></Card>
        <Card><CardHeader><CardTitle>{products.reduce((acc, p) => acc + p.candidates.length, 0)}</CardTitle><CardDescription>Candidate improvements</CardDescription></CardHeader></Card>
        <Card><CardHeader><CardTitle>{products.filter((p) => p.warnings.length > 0).length}</CardTitle><CardDescription>Products with baseline warnings</CardDescription></CardHeader></Card>
      </div>
      <Card>
        <CardHeader><CardTitle>Catalog triage</CardTitle><CardDescription>Start with products where Mirakl is incomplete or noisy.</CardDescription></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Product</TableHead><TableHead>Category</TableHead><TableHead>Score</TableHead><TableHead>Warnings</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader>
            <TableBody>
              {products.map((product) => <TableRow key={product.id}><TableCell><div className="flex flex-col gap-1"><span className="font-medium">{product.title}</span><span className="text-xs text-muted-foreground">{product.sourceSku} · EAN {product.ean}</span></div></TableCell><TableCell>{product.categoryPath.join(" / ")}</TableCell><TableCell><Badge variant={product.scoreBand === "red" ? "destructive" : "secondary"}>{product.score}/100</Badge></TableCell><TableCell>{product.warnings.length}</TableCell><TableCell className="text-right"><Button asChild size="sm"><Link href={`/products/${product.id}`}>Review</Link></Button></TableCell></TableRow>)}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  )
}
