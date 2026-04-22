import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getFieldLabel } from "@/lib/demo-contract"
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
          : Math.round(
              (schema.requiredAttributes.length /
                (schema.requiredAttributes.length + schema.recommendedAttributes.length)) *
                100,
            ),
    }
  })

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 p-6">
      <section className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Schemas</h1>
        <p className="max-w-3xl text-muted-foreground">
          Review how each demo schema defines category-specific completeness, warning pressure, and review expectations before any export-preview step.
        </p>
      </section>

      <Alert>
        <AlertTitle>Preview-safe schema reference</AlertTitle>
        <AlertDescription>
          These schema rules are demo-authored and read-only in this workspace. They do not sync to Mirakl or modify any live marketplace configuration.
        </AlertDescription>
      </Alert>

      <section className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>{schemas.length}</CardTitle>
            <CardDescription>Schema families staged for the demo</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{linkedCategoryCount}</CardTitle>
            <CardDescription>Linked category groups covered</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{totalRequiredFields}</CardTitle>
            <CardDescription>Total required-field obligations</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{totalRecommendedFields}</CardTitle>
            <CardDescription>Recommended enrichments that lift score</CardDescription>
          </CardHeader>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Completeness rules at a glance</CardTitle>
          <CardDescription>
            Required fields define the minimum review bar for a category. Recommended fields raise score quality and reduce operator follow-up.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Schema</TableHead>
                <TableHead>Linked categories</TableHead>
                <TableHead>Required to exit review</TableHead>
                <TableHead>Recommended coverage</TableHead>
                <TableHead>Assigned demo products</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {schemasWithProducts.map(({ schema, assignedProducts, completenessRatio }) => (
                <TableRow key={schema.id}>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span className="font-medium">{schema.name}</span>
                      <span className="text-xs text-muted-foreground">/{schema.slug}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1.5">
                      {schema.linkedCategories.map((category) => (
                        <Badge key={category} variant="outline">
                          {category}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span className="font-medium">{schema.requiredAttributes.length} required fields</span>
                      <span className="text-xs text-muted-foreground">{formatFieldList(schema.requiredAttributes.slice(0, 3))}{schema.requiredAttributes.length > 3 ? ", …" : ""}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span className="font-medium">{schema.recommendedAttributes.length} recommended fields</span>
                      <span className="text-xs text-muted-foreground">{completenessRatio}% of this schema&apos;s rule set is mandatory before export preview</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span className="font-medium">{assignedProducts.length}</span>
                      <span className="text-xs text-muted-foreground">
                        {assignedProducts.length > 0 ? assignedProducts.map((product) => product.title).join(", ") : "No demo product linked yet"}
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <section className="grid gap-4 xl:grid-cols-2">
        {schemasWithProducts.map(({ schema, assignedProducts, completenessRatio }) => (
          <Card key={schema.id} id={schema.slug}>
            <CardHeader className="gap-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <CardTitle>{schema.name}</CardTitle>
                  <CardDescription>
                    Category coverage: {schema.linkedCategories.join(" · ")}.
                    {" "}
                    Use these rules to explain why a product is still blocked or ready for export preview.
                  </CardDescription>
                </div>
                <Badge variant="outline">{completenessRatio}% mandatory before export preview</Badge>
              </div>
              <div className="flex flex-wrap gap-2">
                {schema.linkedCategories.map((category) => (
                  <Badge key={category} variant="secondary">
                    {category}
                  </Badge>
                ))}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <Card>
                  <CardHeader className="p-4">
                    <CardDescription>Required fields</CardDescription>
                    <CardTitle>{schema.requiredAttributes.length}</CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="p-4">
                    <CardDescription>Recommended fields</CardDescription>
                    <CardTitle>{schema.recommendedAttributes.length}</CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="p-4">
                    <CardDescription>Assigned demo products</CardDescription>
                    <CardTitle>{assignedProducts.length}</CardTitle>
                  </CardHeader>
                </Card>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Required to exit review</CardTitle>
                    <CardDescription>
                      Missing any of these fields should keep the product in a blocked or needs-enrichment state for this category.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-wrap gap-2">
                    {schema.requiredAttributes.map((field) => (
                      <Badge key={field} variant="outline">
                        {getFieldLabel(field)}
                      </Badge>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Recommended coverage</CardTitle>
                    <CardDescription>
                      These fields strengthen confidence, improve scoring, and reduce operator follow-up without blocking the initial export preview.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-wrap gap-2">
                    {schema.recommendedAttributes.map((field) => (
                      <Badge key={field} variant="secondary">
                        {getFieldLabel(field)}
                      </Badge>
                    ))}
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Warning pressure</CardTitle>
                    <CardDescription>
                      Reviewers should expect these issues to appear when baseline data does not satisfy the category rule set.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      {schema.warningRules.map((rule) => (
                        <li key={rule}>• {rule}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Scoring guidance</CardTitle>
                    <CardDescription>
                      These demo scoring cues explain how completeness changes product quality across categories.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      {schema.scoringRules.map((rule) => (
                        <li key={rule}>• {rule}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Demo products mapped to this schema</CardTitle>
                  <CardDescription>
                    This list is preview-only and helps explain which demo records should follow the rule set above.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {assignedProducts.length > 0 ? (
                    assignedProducts.map((product) => (
                      <div key={product.id} className="flex flex-col gap-1 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="font-medium">{product.title}</p>
                          <p className="text-sm text-muted-foreground">
                            Mirakl ID {product.miraklProductId} · {product.categoryPath.join(" / ")}
                          </p>
                        </div>
                        <Badge variant="outline">{product.listingStatus}</Badge>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No demo product is currently assigned to this schema, so the rule set remains visible as a planning reference only.
                    </p>
                  )}
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        ))}
      </section>
    </main>
  )
}
