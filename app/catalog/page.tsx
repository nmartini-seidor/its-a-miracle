import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { listProducts } from "@/server/data"

export default async function CatalogPage() {
  const products = await listProducts()

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 p-6">
      <section className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Catalog</h1>
        <p className="max-w-3xl text-muted-foreground">Understand the imported Mirakl baseline catalog before research, candidate approval, or export-preview work begins.</p>
      </section>
      <Alert>
        <AlertTitle>Baseline catalog only</AlertTitle>
        <AlertDescription>This page summarizes imported demo records and schema assignment. It is safe to inspect and does not perform live Mirakl mutations.</AlertDescription>
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
            <CardTitle>{products.filter((product) => product.listingStatus !== "READY_FOR_REVIEW").length}</CardTitle>
            <CardDescription>Baselines currently needing enrichment</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{new Set(products.map((product) => product.schemaId)).size}</CardTitle>
            <CardDescription>Schema families already assigned</CardDescription>
          </CardHeader>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Imported baseline records</CardTitle>
          <CardDescription>Catalog framing is distinct from triage: this table focuses on imported status, schema assignment, and baseline readiness.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Mirakl ID</TableHead>
                <TableHead>Schema</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Warnings</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>{product.title}</TableCell>
                  <TableCell>{product.miraklProductId}</TableCell>
                  <TableCell>{product.schemaId}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{product.listingStatus}</Badge>
                  </TableCell>
                  <TableCell>{product.warnings.length}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  )
}
