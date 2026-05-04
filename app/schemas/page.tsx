import Link from "next/link"
import { ArrowRightIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { PageHeader, PageShell, Panel } from "@/components/app/page-chrome"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getFieldLabel } from "@/lib/demo-contract"
import type { AttributeFieldId } from "@/lib/types"
import { listProducts, listSchemas } from "@/server/data"

export const dynamic = "force-dynamic"

function formatFieldList(fields: AttributeFieldId[]) {
  return fields.map((field) => getFieldLabel(field)).join(", ")
}

export default async function SchemasPage() {
  const [schemas, products] = await Promise.all([listSchemas(), listProducts()])

  const schemasWithProducts = schemas.map((schema) => ({
    schema,
    assignedProducts: products.filter((product) => product.schemaId === schema.id),
  }))

  return (
    <PageShell>
      <PageHeader title="Schema configuration" />

      <Panel title="Schema families" description="Configure each schema on its own page. This overview stays as a single readable table.">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Schema</TableHead>
              <TableHead>Linked categories</TableHead>
              <TableHead>Required fields</TableHead>
              <TableHead>Recommended fields</TableHead>
              <TableHead>Warning rules</TableHead>
              <TableHead>Scoring rules</TableHead>
              <TableHead>Products</TableHead>
              <TableHead className="text-right">Configuration</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {schemasWithProducts.map(({ schema, assignedProducts }) => (
              <TableRow key={schema.id}>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <span className="font-semibold text-slate-950">{schema.name}</span>
                    <span className="font-mono text-xs text-slate-500">/{schema.slug}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex max-w-72 flex-wrap gap-1.5">
                    {schema.linkedCategories.map((category) => <Badge key={category} variant="outline">{category}</Badge>)}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <span className="font-semibold">{schema.requiredAttributes.length}</span>
                    <span className="max-w-72 text-xs text-slate-500">{formatFieldList(schema.requiredAttributes.slice(0, 4))}{schema.requiredAttributes.length > 4 ? ", …" : ""}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <span className="font-semibold">{schema.recommendedAttributes.length}</span>
                    <span className="max-w-72 text-xs text-slate-500">{schema.recommendedAttributes.length > 0 ? formatFieldList(schema.recommendedAttributes.slice(0, 4)) : "None"}{schema.recommendedAttributes.length > 4 ? ", …" : ""}</span>
                  </div>
                </TableCell>
                <TableCell>{schema.warningRules.length}</TableCell>
                <TableCell>{schema.scoringRules.length}</TableCell>
                <TableCell>{assignedProducts.length}</TableCell>
                <TableCell className="text-right">
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/schemas/${schema.slug}`}>
                      Configure
                      <ArrowRightIcon data-icon="inline-end" />
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Panel>
    </PageShell>
  )
}
