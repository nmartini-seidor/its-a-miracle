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
        title="Product triage"
        description="Review low-quality Mirakl records, compare evidence, and open only the products that need operator attention."
        badges={<Badge variant="outline">Evidence workflow</Badge>}
      />

      <MetricStrip
        metrics={[
          { label: "Catalog", value: products.length, detail: "Products available for triage." },
          { label: "Need enrichment", value: productsNeedingReview.length, detail: "Records that should not pass review yet.", tone: "danger" },
          { label: "Candidates", value: candidateCount, detail: "Suggested field improvements staged for review.", tone: "success" },
          { label: "Evidence", value: evidenceCount, detail: "Sources attached to product records.", tone: "warning" },
        ]}
      />

      <TriageDashboard products={products} />
    </PageShell>
  )
}
