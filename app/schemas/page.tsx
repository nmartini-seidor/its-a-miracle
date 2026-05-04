import { Badge } from "@/components/ui/badge"
import { PageHeader, PageShell, MetricStrip, Panel } from "@/components/app/page-chrome"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getFieldLabel } from "@/lib/demo-contract"
import { formatEnumLabel } from "@/lib/labels"
import type { AttributeFieldId } from "@/lib/types"
import { listProducts, listSchemas } from "@/server/data"

function formatFieldList(fields: AttributeFieldId[]) {
  return fields.map((field) => getFieldLabel(field)).join(", ")
}

export default async function SchemasPage() {
  const [schemas, products] = await Promise.all([listSchemas(), listProducts()])

  const linkedCategoryCount = new Set(schemas.flatMap((schema) => schema.linkedCategories)).size
  const totalRequiredFields = schemas.reduce((total, schema) => total + schema.requiredAttributes.length, 0)
  const totalRecommendedFields = schemas.reduce((total, schema) => total + schema.recommendedAttributes.length, 0)

  const schemasWithProducts = schemas.map((schema) => {
    const assignedProducts = products.filter((product) => product.schemaId === schema.id)

    return {
      schema,
      assignedProducts,
      completenessRatio:
        schema.requiredAttributes.length + schema.recommendedAttributes.length === 0
          ? 0
          : Math.round((schema.requiredAttributes.length / (schema.requiredAttributes.length + schema.recommendedAttributes.length)) * 100),
    }
  })

  return (
    <PageShell>
      <PageHeader
        eyebrow="Schemas"
        title="Schema rules"
        description="Review category completeness, warning pressure, and scoring expectations for the catalog."
        badges={<Badge variant="outline">Rule reference</Badge>}
      />

      <MetricStrip
        metrics={[
          { label: "Schema families", value: schemas.length, detail: "Configured for the catalog." },
          { label: "Categories", value: linkedCategoryCount, detail: "Linked category groups covered." },
          { label: "Required", value: totalRequiredFields, detail: "Field obligations before review exit.", tone: "danger" },
          { label: "Recommended", value: totalRecommendedFields, detail: "Enrichments that lift score.", tone: "success" },
        ]}
      />

      <Panel title="Completeness rules at a glance" description="Required fields define the minimum review bar. Recommended fields raise score quality and reduce operator follow-up.">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Schema</TableHead>
              <TableHead>Linked categories</TableHead>
              <TableHead>Required to exit review</TableHead>
              <TableHead>Recommended coverage</TableHead>
              <TableHead>Assigned products</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {schemasWithProducts.map(({ schema, assignedProducts, completenessRatio }) => (
              <TableRow key={schema.id}>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <span className="font-semibold">{schema.name}</span>
                    <span className="font-mono text-xs text-muted-foreground">/{schema.slug}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1.5">
                    {schema.linkedCategories.map((category) => (
                      <Badge key={category} variant="outline">{category}</Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <span className="font-semibold">{schema.requiredAttributes.length} required fields</span>
                    <span className="text-xs text-muted-foreground">{formatFieldList(schema.requiredAttributes.slice(0, 3))}{schema.requiredAttributes.length > 3 ? ", …" : ""}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <span className="font-semibold">{schema.recommendedAttributes.length} recommended fields</span>
                    <span className="text-xs text-muted-foreground">{completenessRatio}% of this schema&apos;s rule set is mandatory before export</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <span className="font-semibold">{assignedProducts.length}</span>
                    <span className="text-xs text-muted-foreground">{assignedProducts.length > 0 ? assignedProducts.map((product) => product.title).join(", ") : "No product linked yet"}</span>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Panel>

      <section className="grid gap-6 xl:grid-cols-2">
        {schemasWithProducts.map(({ schema, assignedProducts, completenessRatio }) => (
          <Panel
            key={schema.id}
            title={schema.name}
            description={`${schema.linkedCategories.join(" · ")} · ${completenessRatio}% of this schema's rule set is mandatory before export.`}
          >
            <div className="flex flex-col gap-6">
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  ["Required", schema.requiredAttributes.length],
                  ["Recommended", schema.recommendedAttributes.length],
                  ["Assigned", assignedProducts.length],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100">
                    <p className="text-xs font-medium text-slate-500">{label}</p>
                    <p className="mt-2 text-3xl font-black tracking-[-0.05em]">{value}</p>
                  </div>
                ))}
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-2xl bg-slate-50/80 p-4 ring-1 ring-slate-100">
                  <h3 className="font-semibold">Required to exit review</h3>
                  <p className="mt-1 text-sm text-muted-foreground">Missing any of these fields keeps the product blocked for this category.</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {schema.requiredAttributes.map((field) => <Badge key={field} variant="outline">{getFieldLabel(field)}</Badge>)}
                  </div>
                </div>
                <div className="rounded-2xl bg-slate-50/80 p-4 ring-1 ring-slate-100">
                  <h3 className="font-semibold">Recommended coverage</h3>
                  <p className="mt-1 text-sm text-muted-foreground">These fields strengthen confidence without blocking the initial export.</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {schema.recommendedAttributes.map((field) => <Badge key={field} variant="secondary">{getFieldLabel(field)}</Badge>)}
                  </div>
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-2xl bg-slate-50/80 p-4 ring-1 ring-slate-100">
                  <h3 className="font-semibold">Warning pressure</h3>
                  <ul className="mt-3 flex flex-col gap-2 text-sm text-muted-foreground">
                    {schema.warningRules.map((rule) => <li key={rule}>• {rule}</li>)}
                  </ul>
                </div>
                <div className="rounded-2xl bg-slate-50/80 p-4 ring-1 ring-slate-100">
                  <h3 className="font-semibold">Scoring guidance</h3>
                  <ul className="mt-3 flex flex-col gap-2 text-sm text-muted-foreground">
                    {schema.scoringRules.map((rule) => <li key={rule}>• {rule}</li>)}
                  </ul>
                </div>
              </div>

              <div className="rounded-2xl bg-slate-50/80 p-4 ring-1 ring-slate-100">
                <h3 className="font-semibold">Products mapped to this schema</h3>
                <div className="mt-4 divide-y divide-slate-200 overflow-hidden rounded-xl bg-white ring-1 ring-slate-200">
                  {assignedProducts.length > 0 ? (
                    assignedProducts.map((product) => (
                      <div key={product.id} className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="font-medium">{product.title}</p>
                          <p className="text-sm text-muted-foreground">Mirakl ID {product.miraklProductId} · {product.categoryPath.join(" / ")}</p>
                        </div>
                        <Badge variant="outline">{formatEnumLabel(product.listingStatus)}</Badge>
                      </div>
                    ))
                  ) : (
                    <p className="p-3 text-sm text-muted-foreground">No product is currently assigned to this schema.</p>
                  )}
                </div>
              </div>
            </div>
          </Panel>
        ))}
      </section>
    </PageShell>
  )
}
