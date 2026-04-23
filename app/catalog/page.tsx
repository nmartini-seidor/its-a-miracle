import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { PageHeader, PageShell, MetricStrip, Panel } from "@/components/app/page-chrome"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { listProducts } from "@/server/data"

export default async function CatalogPage() {
  const products = await listProducts()
  const needsEnrichment = products.filter((product) => product.listingStatus !== "READY_FOR_REVIEW").length
  const schemaCount = new Set(products.map((product) => product.schemaId)).size

  return (
    <PageShell>
      <PageHeader
        eyebrow="Catalog"
        title="Imported baseline, without the clutter."
        description="A read-only view of the demo records, schema assignment, and baseline readiness before any research or export-preview work begins."
        badges={<Badge variant="outline">Baseline catalog only</Badge>}
      />

      <Alert>
        <AlertTitle>Baseline catalog only</AlertTitle>
        <AlertDescription>This page summarizes imported demo records and schema assignment. It is safe to inspect and does not perform live Mirakl mutations.</AlertDescription>
      </Alert>

      <MetricStrip
        columns="xl:grid-cols-3"
        metrics={[
          { label: "Imported", value: products.length, detail: "Demo products available." },
          { label: "Need enrichment", value: needsEnrichment, detail: "Baselines below the desired review bar.", tone: "danger" },
          { label: "Schema families", value: schemaCount, detail: "Category rule sets already assigned.", tone: "warning" },
        ]}
      />

      <Panel title="Imported baseline records" description="Catalog framing is distinct from triage: this table focuses on status, schema assignment, and baseline readiness.">
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
                <TableCell className="font-semibold">{product.title}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{product.miraklProductId}</TableCell>
                <TableCell>{product.schemaId}</TableCell>
                <TableCell>
                  <Badge variant="outline">{product.listingStatus}</Badge>
                </TableCell>
                <TableCell className={product.warnings.length > 0 ? "font-semibold text-destructive" : undefined}>{product.warnings.length}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Panel>
    </PageShell>
  )
}
