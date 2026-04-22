import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TriageDashboard } from "@/components/product/triage-dashboard"
import { listProducts } from "@/server/data"

export default async function DashboardPage() {
  const products = await listProducts()
  const productsNeedingReview = products.filter((product) => product.listingStatus !== "READY_FOR_REVIEW")

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
            Triage low-quality Mirakl records, compare the baseline with simulated evidence, and move into product review only when the record needs intervention.
          </p>
        </div>
      </section>
      <Alert>
        <AlertTitle>Preview-safe workflow</AlertTitle>
        <AlertDescription>
          This demo workspace simulates research, evidence, and candidate decisions locally. It does not mutate Mirakl directly.
        </AlertDescription>
      </Alert>
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-primary/20 bg-gradient-to-br from-card to-violet-50/80">
          <CardHeader>
            <CardTitle className="text-primary">{products.length}</CardTitle>
            <CardDescription>Products in demo catalog</CardDescription>
          </CardHeader>
        </Card>
        <Card className="border-destructive/20 bg-gradient-to-br from-card to-red-50/70">
          <CardHeader>
            <CardTitle className="text-destructive">{productsNeedingReview.length}</CardTitle>
            <CardDescription>Products needing enrichment</CardDescription>
          </CardHeader>
        </Card>
        <Card className="border-emerald-300/60 bg-gradient-to-br from-card to-emerald-50/80">
          <CardHeader>
            <CardTitle className="text-emerald-700">{products.reduce((acc, product) => acc + product.candidates.length, 0)}</CardTitle>
            <CardDescription>Candidate improvements</CardDescription>
          </CardHeader>
        </Card>
        <Card className="border-sky-300/60 bg-gradient-to-br from-card to-sky-50/80">
          <CardHeader>
            <CardTitle className="text-sky-700">{products.reduce((acc, product) => acc + product.evidence.length, 0)}</CardTitle>
            <CardDescription>Evidence sources staged</CardDescription>
          </CardHeader>
        </Card>
      </div>
      <TriageDashboard products={products} />
    </main>
  )
}
