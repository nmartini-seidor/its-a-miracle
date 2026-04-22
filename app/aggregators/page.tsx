import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { listAggregators } from "@/server/data"

export default async function AggregatorsPage() {
  const aggregators = await listAggregators()

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 p-6">
      <section className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Aggregators</h1>
        <p className="max-w-3xl text-muted-foreground">This route reserves the evidence-source area in the workspace shell. A later task will deepen source authority, confidence, and provider detail.</p>
      </section>
      <Alert>
        <AlertTitle>Preview-safe placeholder</AlertTitle>
        <AlertDescription>This section proves routing and shell structure only. It does not call external providers or perform live research.</AlertDescription>
      </Alert>
      <Card>
        <CardHeader>
          <CardTitle>{aggregators.length} mocked source providers staged</CardTitle>
          <CardDescription>Manufacturer, retailer, spec-database, marketplace, and internal-reference providers are ready for later expansion.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Aggregator detail cards and confidence logic are intentionally deferred to the dedicated Aggregators task.
        </CardContent>
      </Card>
    </main>
  )
}
