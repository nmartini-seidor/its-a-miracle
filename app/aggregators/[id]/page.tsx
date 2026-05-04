import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeftIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PageHeader, PageShell } from "@/components/app/page-chrome"
import { AggregatorConfigurationForm } from "@/components/aggregator/aggregator-configuration-form"
import { listAggregators, listProducts } from "@/server/data"

export const dynamic = "force-dynamic"

export async function generateStaticParams() {
  const aggregators = await listAggregators()
  return aggregators.map((aggregator) => ({ id: aggregator.id }))
}

export default async function AggregatorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [aggregators, products] = await Promise.all([listAggregators(), listProducts()])
  const aggregator = aggregators.find((item) => item.id === id)

  if (!aggregator) notFound()

  const evidence = products.flatMap((product) => product.evidence.filter((record) => record.aggregatorId === aggregator.id))

  return (
    <PageShell>
      <div className="flex">
        <Button asChild variant="outline" size="sm">
          <Link href="/aggregators">
            <ArrowLeftIcon data-icon="inline-start" />
            Back to aggregators
          </Link>
        </Button>
      </div>

      <PageHeader title={`${aggregator.name} configuration`} />
      <AggregatorConfigurationForm aggregator={aggregator} evidence={evidence} />
    </PageShell>
  )
}
