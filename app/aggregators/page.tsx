import Link from "next/link"
import { ArrowRightIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { PageHeader, PageShell, Panel } from "@/components/app/page-chrome"
import { AuthorityScoreMeter, AuthorityTierBadge } from "@/components/aggregator/authority-tier"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getAuthorityTier } from "@/lib/aggregator-policy"
import { formatEnumLabel } from "@/lib/labels"
import { listAggregators, listProducts } from "@/server/data"

export const dynamic = "force-dynamic"

const confidenceBadgeClassNames = {
  high: "border-emerald-200 bg-emerald-50 text-emerald-800",
  medium: "border-amber-200 bg-amber-50 text-amber-800",
  low: "border-rose-200 bg-rose-50 text-rose-800",
} as const

const statusBadgeClassNames = {
  enabled: "border-blue-200 bg-blue-50 text-blue-800",
  disabled: "border-slate-200 bg-slate-100 text-slate-600",
} as const

const AGGREGATORS_PER_PAGE = 10

function getPageHref(page: number) {
  return page === 1 ? "/aggregators" : `/aggregators?page=${page}`
}

export default async function AggregatorsPage({ searchParams }: { searchParams?: Promise<{ page?: string }> }) {
  const params = await searchParams
  const [aggregators, products] = await Promise.all([listAggregators(), listProducts()])

  const aggregatorRows = aggregators.map((aggregator) => {
    const evidence = products.flatMap((product) => product.evidence.filter((record) => record.aggregatorId === aggregator.id))
    const touchedProducts = new Set(evidence.map((record) => record.productId)).size
    const tier = getAuthorityTier(aggregator.authorityScore)

    return {
      ...aggregator,
      tier,
      evidenceCount: evidence.length,
      touchedProducts,
    }
  })
  const pageCount = Math.max(1, Math.ceil(aggregatorRows.length / AGGREGATORS_PER_PAGE))
  const requestedPage = Number(params?.page ?? "1")
  const currentPage = Number.isFinite(requestedPage) ? Math.min(Math.max(Math.trunc(requestedPage), 1), pageCount) : 1
  const pageStart = (currentPage - 1) * AGGREGATORS_PER_PAGE
  const visibleAggregatorRows = aggregatorRows.slice(pageStart, pageStart + AGGREGATORS_PER_PAGE)

  const tiers = [
    getAuthorityTier(95),
    getAuthorityTier(85),
    getAuthorityTier(70),
    getAuthorityTier(45),
  ]

  return (
    <PageShell>
      <PageHeader title="Aggregator configuration" />

      <Panel title="Why authority matters" description="Authority controls how much each evidence source can influence a candidate value before export review.">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {tiers.map((tier) => (
            <div key={tier.id} className={`rounded-2xl border p-4 ${tier.colorClassName}`}>
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-semibold tracking-[-0.02em]">{tier.label}</h2>
                <Badge variant="outline" className={tier.badgeClassName}>{tier.range}</Badge>
              </div>
              <p className="mt-3 text-sm leading-6 opacity-85">{tier.summary}</p>
              <p className="mt-3 text-sm font-semibold leading-6">{tier.importance}</p>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Aggregators" description="Configure each evidence source on its own page. The list stays focused on source importance, usage, and status." headerClassName="bg-white" bodyClassName="p-0 sm:p-0">
        <Table surface="flush">
          <TableHeader>
            <TableRow>
              <TableHead>Aggregator</TableHead>
              <TableHead>Authority</TableHead>
              <TableHead>Importance</TableHead>
              <TableHead>Default confidence</TableHead>
              <TableHead>Coverage</TableHead>
              <TableHead>Current use</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Configuration</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleAggregatorRows.map((aggregator) => (
              <TableRow key={aggregator.id}>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <span className="font-semibold text-slate-950">{aggregator.name}</span>
                    <span className="font-mono text-xs text-slate-500">{aggregator.id}</span>
                    <span className="text-xs text-slate-500">{formatEnumLabel(aggregator.type)}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-2">
                    <AuthorityTierBadge authorityScore={aggregator.authorityScore} />
                    <AuthorityScoreMeter authorityScore={aggregator.authorityScore} />
                  </div>
                </TableCell>
                <TableCell className="max-w-80 text-sm text-slate-600">{aggregator.tier.importance}</TableCell>
                <TableCell><Badge variant="outline" className={confidenceBadgeClassNames[aggregator.defaultConfidence]}>{formatEnumLabel(aggregator.defaultConfidence)}</Badge></TableCell>
                <TableCell className="max-w-72 text-sm text-slate-600">{aggregator.coverageTags.join(", ")}</TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1 text-sm text-slate-600">
                    <span>{aggregator.evidenceCount} evidence records</span>
                    <span>{aggregator.touchedProducts} products touched</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={aggregator.enabled ? statusBadgeClassNames.enabled : statusBadgeClassNames.disabled}>{aggregator.enabled ? "Enabled" : "Disabled"}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/aggregators/${aggregator.id}`}>
                      Configure
                      <ArrowRightIcon data-icon="inline-end" />
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-600">
            Showing {pageStart + 1}-{Math.min(pageStart + AGGREGATORS_PER_PAGE, aggregatorRows.length)} of {aggregatorRows.length} aggregators
          </p>
          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            <Button asChild size="sm" variant="outline" aria-disabled={currentPage === 1} className={currentPage === 1 ? "pointer-events-none opacity-50" : undefined}>
              <Link href={getPageHref(Math.max(1, currentPage - 1))}>Previous</Link>
            </Button>
            {Array.from({ length: pageCount }, (_, index) => index + 1).map((page) => (
              <Button key={page} asChild size="sm" variant={page === currentPage ? "default" : "outline"}>
                <Link href={getPageHref(page)} aria-current={page === currentPage ? "page" : undefined}>{page}</Link>
              </Button>
            ))}
            <Button asChild size="sm" variant="outline" aria-disabled={currentPage === pageCount} className={currentPage === pageCount ? "pointer-events-none opacity-50" : undefined}>
              <Link href={getPageHref(Math.min(pageCount, currentPage + 1))}>Next</Link>
            </Button>
          </div>
        </div>
      </Panel>
    </PageShell>
  )
}
