import Link from "next/link"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ScoreBadge } from "@/components/product/score-badge"
import { listProducts } from "@/server/data"

export default async function DashboardPage() {
  const products = await listProducts()

  return (
    <main className="mx-auto flex max-w-7xl flex-col gap-6 p-6">
      <section className="flex flex-col gap-3">
        <Badge variant="secondary" className="w-fit">
          Mirakl baseline + simulated evidence candidates
        </Badge>
        <div className="flex flex-col gap-2">
          <h1 className="bg-gradient-to-r from-primary via-violet-500 to-emerald-500 bg-clip-text text-3xl font-semibold tracking-tight text-transparent">
            Mirakl enrichment workspace
          </h1>
          <p className="max-w-3xl text-muted-foreground">
            Review low-quality Mirakl records, compare baseline data with simulated source evidence, and approve field-level improvements before any export step.
          </p>
        </div>
      </section>
      <Alert>
        <AlertTitle>Preview-safe workflow</AlertTitle>
        <AlertDescription>
          This demo workspace simulates research, evidence, and candidate decisions locally. It does not mutate Mirakl directly.
        </AlertDescription>
      </Alert>
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-primary/20 bg-gradient-to-br from-card to-violet-50/80">
          <CardHeader>
            <CardTitle className="text-primary">{products.length}</CardTitle>
            <CardDescription>Products in demo catalog</CardDescription>
          </CardHeader>
        </Card>
        <Card className="border-emerald-300/60 bg-gradient-to-br from-card to-emerald-50/80">
          <CardHeader>
            <CardTitle className="text-emerald-700">{products.reduce((acc, product) => acc + product.candidates.length, 0)}</CardTitle>
            <CardDescription>Candidate improvements</CardDescription>
          </CardHeader>
        </Card>
        <Card className="border-destructive/20 bg-gradient-to-br from-card to-red-50/70">
          <CardHeader>
            <CardTitle className="text-destructive">{products.filter((product) => product.warnings.length > 0).length}</CardTitle>
            <CardDescription>Products with baseline warnings</CardDescription>
          </CardHeader>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Catalog triage</CardTitle>
          <CardDescription>Start with products whose Mirakl baseline is incomplete, noisy, or missing required schema fields.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Warnings</TableHead>
                <TableHead>Candidates</TableHead>
                <TableHead>Evidence</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span className="font-medium">{product.title}</span>
                      <span className="text-xs text-muted-foreground">
                        {product.miraklProductId} · EAN {product.bestEvidenceByField.ean ?? "Evidence pending"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{product.categoryPath.join(" / ")}</TableCell>
                  <TableCell>
                    <ScoreBadge score={product.qualityScore} band={product.scoreBand} />
                  </TableCell>
                  <TableCell>{product.warnings.length}</TableCell>
                  <TableCell>{product.candidates.length}</TableCell>
                  <TableCell>{product.evidence.length}</TableCell>
                  <TableCell className="text-right">
                    <Button asChild size="sm">
                      <Link href={`/products/${product.id}`}>Review</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  )
}
