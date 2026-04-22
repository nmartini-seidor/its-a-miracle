import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { listProducts } from "@/server/data"

export default async function CatalogPage() {
  const products = await listProducts()
  const productsNeedingEnrichment = products.filter((product) => product.listingStatus !== "READY_FOR_REVIEW")
  const schemaCoverage = new Set(products.map((product) => product.schemaId)).size

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 p-6">
      <section className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Catalog</h1>
        <p className="max-w-3xl text-muted-foreground">
          Review the imported Mirakl baseline catalog before research, candidate approval, or export-preview work begins.
        </p>
      </section>
      <Alert>
        <AlertTitle>Baseline catalog only</AlertTitle>
        <AlertDescription>This section summarizes imported demo records. It is safe to inspect and does not perform live Mirakl mutations.</AlertDescription>
      </Alert>
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>{products.length}</CardTitle>
            <CardDescription>Imported demo products</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{productsNeedingEnrichment.length}</CardTitle>
            <CardDescription>Products currently needing enrichment</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{schemaCoverage}</CardTitle>
            <CardDescription>Schemas already represented in the demo catalog</CardDescription>
          </CardHeader>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Catalog handoff</CardTitle>
          <CardDescription>Later tasks will deepen this section with richer baseline status, filters, and catalog-specific framing.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          For now, this page proves the top-level information architecture and keeps the workspace navigation aligned with the approved spec.
        </CardContent>
      </Card>
    </main>
  )
}
