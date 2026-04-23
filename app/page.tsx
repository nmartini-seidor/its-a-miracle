import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { PageHeader, PageShell, MetricStrip } from "@/components/app/page-chrome"
import { TriageDashboard } from "@/components/product/triage-dashboard"
import { listProducts } from "@/server/data"

export default async function DashboardPage() {
  const products = await listProducts()
  const productsNeedingReview = products.filter((product) => product.listingStatus !== "READY_FOR_REVIEW")
  const candidateCount = products.reduce((acc, product) => acc + product.candidates.length, 0)
  const evidenceCount = products.reduce((acc, product) => acc + product.evidence.length, 0)

  return (
    <PageShell>
      <PageHeader
        eyebrow="Triage"
        title="Find the broken records first."
        description="A cleaner operating desk for Mirakl product data: one readable queue, direct review actions, and visible guardrails instead of stacks of cards."
        badges={<Badge variant="outline">Local evidence simulation</Badge>}
      />

      <Alert>
        <AlertTitle>Preview-safe workflow</AlertTitle>
        <AlertDescription>
          This demo simulates research, evidence, and candidate decisions locally. It does not mutate Mirakl directly.
        </AlertDescription>
      </Alert>

      <MetricStrip
        metrics={[
          { label: "Demo catalog", value: products.length, detail: "Products available for triage." },
          { label: "Need enrichment", value: productsNeedingReview.length, detail: "Records that should not pass review yet.", tone: "danger" },
          { label: "Candidates", value: candidateCount, detail: "Suggested field improvements staged for review.", tone: "success" },
          { label: "Evidence", value: evidenceCount, detail: "Sources attached to the local walkthrough.", tone: "warning" },
        ]}
      />

      <TriageDashboard products={products} />
    </PageShell>
  )
}
