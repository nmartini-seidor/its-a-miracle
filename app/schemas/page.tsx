import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { listSchemas } from "@/server/data"

export default async function SchemasPage() {
  const schemas = await listSchemas()

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 p-6">
      <section className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Schemas</h1>
        <p className="max-w-3xl text-muted-foreground">This route reserves the schema area in the workspace shell. A later task will add detail pages, scoring rules, and schema-to-product drill-downs.</p>
      </section>
      <Alert>
        <AlertTitle>Preview-safe placeholder</AlertTitle>
        <AlertDescription>This section currently proves navigation and information architecture only. It does not run any live schema sync.</AlertDescription>
      </Alert>
      <Card>
        <CardHeader>
          <CardTitle>{schemas.length} schema families staged for the demo</CardTitle>
          <CardDescription>Examples include headphones, smartphones, televisions, tablets, and laptops.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Schema details will be expanded in the dedicated Schemas task after the hero review flow is stable.
        </CardContent>
      </Card>
    </main>
  )
}
