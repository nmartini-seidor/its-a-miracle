import { Badge } from "@/components/ui/badge"
import { CatalogSchemaSelect } from "@/components/catalog-schema-select"
import { PageHeader, PageShell, MetricStrip, Panel } from "@/components/app/page-chrome"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatEnumLabel } from "@/lib/labels"
import { listProducts, listSchemas } from "@/server/data"

export default async function CatalogPage() {
  const [products, schemas] = await Promise.all([listProducts(), listSchemas()])
  const schemaOptions = schemas.map((schema) => ({ id: schema.id, name: schema.name }))
  const needsEnrichment = products.filter((product) => product.listingStatus !== "READY_FOR_REVIEW").length
  const schemaCount = new Set(products.map((product) => product.schemaId)).size

  return (
    <PageShell>
      <PageHeader
        eyebrow="Catalog"
        title="Catalog baseline"
        description="Inspect imported records, select schema assignments, and check baseline readiness before review work begins."
        badges={<Badge variant="outline">Baseline catalog only</Badge>}
      />

      <MetricStrip
        columns="xl:grid-cols-3"
        metrics={[
          { label: "Imported", value: products.length, detail: "Products available." },
          { label: "Need enrichment", value: needsEnrichment, detail: "Baselines below the desired review bar.", tone: "danger" },
          { label: "Schema families", value: schemaCount, detail: "Flexible rule sets assigned in the table.", tone: "warning" },
        ]}
      />

      <Panel title="Imported baseline records" description="Catalog framing is distinct from triage: schema assignment is editable directly in the table." headerClassName="bg-white" bodyClassName="p-0 sm:p-0">
        <Table surface="flush">
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
                <TableCell><CatalogSchemaSelect productId={product.id} value={product.schemaId} schemas={schemaOptions} /></TableCell>
                <TableCell>
                  <Badge variant="outline">{formatEnumLabel(product.listingStatus)}</Badge>
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
