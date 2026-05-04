"use client"

import Link from "next/link"
import { ArrowDownWideNarrowIcon, ArrowRightIcon, BotIcon, FolderTreeIcon, TriangleAlertIcon, type LucideIcon } from "lucide-react"
import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Panel } from "@/components/app/page-chrome"
import { ResetWorkspaceButton } from "@/components/settings/reset-workspace-button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ScoreBadge } from "@/components/product/score-badge"
import { formatEnumLabel } from "@/lib/labels"
import { filterProducts, sortProducts, type TriageFilterId, type TriageSortId } from "@/lib/triage"
import type { ProductRecord } from "@/lib/types"
import { cn } from "@/lib/utils"

const filterOptions: { id: TriageFilterId; label: string }[] = [
  { id: "all", label: "All products" },
  { id: "needs-enrichment", label: "Needs enrichment" },
  { id: "with-candidates", label: "Has candidates" },
  { id: "hero-product", label: "Hero product" },
]

const sortOptions: { id: TriageSortId; label: string; Icon: LucideIcon; iconClassName: string }[] = [
  { id: "score-asc", label: "Lowest score", Icon: ArrowDownWideNarrowIcon, iconClassName: "text-blue-500" },
  { id: "warnings-desc", label: "Most warnings", Icon: TriangleAlertIcon, iconClassName: "text-amber-500" },
  { id: "category-asc", label: "Category", Icon: FolderTreeIcon, iconClassName: "text-violet-500" },
]

export function TriageDashboard({ products }: { products: ProductRecord[] }) {
  const router = useRouter()
  const [activeFilter, setActiveFilter] = useState<TriageFilterId>("all")
  const [activeSort, setActiveSort] = useState<TriageSortId>("score-asc")
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([])
  const [queuePending, setQueuePending] = useState(false)
  const [queueStatus, setQueueStatus] = useState<string | null>(null)

  const visibleProducts = useMemo(() => sortProducts(filterProducts(products, activeFilter), activeSort), [products, activeFilter, activeSort])
  const selectedCount = selectedProductIds.length

  function startResearchSelection() {
    setSelectionMode(true)
    setQueueStatus(null)
  }

  function cancelResearchSelection() {
    setSelectionMode(false)
    setSelectedProductIds([])
    setQueueStatus(null)
  }

  function toggleProductSelection(productId: string, checked: boolean) {
    setSelectedProductIds((current) => {
      if (checked) return current.includes(productId) ? current : [...current, productId]
      return current.filter((id) => id !== productId)
    })
    setQueueStatus(null)
  }

  async function pollResearchJobs(jobIds: string[]) {
    const pendingJobIds = new Set(jobIds)

    while (pendingJobIds.size > 0) {
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const statuses = await Promise.all(
        [...pendingJobIds].map(async (jobId) => {
          const response = await fetch(`/api/research-jobs/${jobId}`, { cache: "no-store" })
          const body = await response.json()
          return { jobId, response, body }
        }),
      )

      const failed = statuses.find((status) => !status.response.ok)
      if (failed) throw new Error(failed.body.error ?? "Research status failed")

      statuses.forEach((status) => {
        if (status.body.status === "SUCCEEDED") pendingJobIds.delete(status.jobId)
      })
      setQueueStatus(`Research agents running… ${jobIds.length - pendingJobIds.size}/${jobIds.length} products completed.`)
    }
  }

  async function queueResearchForSelectedProducts() {
    if (selectedCount === 0) return

    setQueuePending(true)
    setQueueStatus(`Queueing research agents for ${selectedCount} ${selectedCount === 1 ? "product" : "products"}…`)
    const results = await Promise.all(
      selectedProductIds.map(async (productId) => {
        const response = await fetch(`/api/products/${productId}/research-jobs`, { method: "POST" })
        return { response, body: await response.json() }
      }),
    )

    const failed = results.find((result) => !result.response.ok)

    if (failed) {
      setQueuePending(false)
      setQueueStatus(failed.body.error ?? "Research queue failed")
      return
    }

    try {
      await pollResearchJobs(results.map((result) => result.body.id))
    } catch (error) {
      setQueuePending(false)
      setQueueStatus(error instanceof Error ? error.message : "Research status failed")
      return
    }

    setQueuePending(false)
    setQueueStatus(`Research completed for ${selectedCount} ${selectedCount === 1 ? "product" : "products"}.`)
    setSelectionMode(false)
    setSelectedProductIds([])
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2 px-1 sm:flex-row sm:items-center sm:justify-between">
        {queueStatus ? <p className="text-sm text-muted-foreground">{queueStatus}</p> : <div aria-hidden="true" />}
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          {selectionMode && (
            <Button type="button" size="lg" variant="ghost" onClick={cancelResearchSelection} className="rounded-full">
              Cancel
            </Button>
          )}
          <Button
            type="button"
            size="lg"
            variant="default"
            disabled={queuePending || (selectionMode && selectedCount === 0)}
            onClick={selectionMode ? queueResearchForSelectedProducts : startResearchSelection}
            className="rounded-full bg-blue-600 px-5 text-white shadow-[0_14px_34px_rgba(37,99,235,0.24)] hover:bg-blue-700 hover:shadow-[0_18px_40px_rgba(37,99,235,0.3)]"
          >
            <BotIcon data-icon="inline-start" />
            {selectionMode ? `Queue Research for ${selectedCount} ${selectedCount === 1 ? "Product" : "Products"}` : "Run Research Agent"}
          </Button>
        </div>
      </div>

      <Panel>
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              {filterOptions.map((filter) => (
                <Button key={filter.id} type="button" size="sm" variant={activeFilter === filter.id ? "default" : "outline"} onClick={() => setActiveFilter(filter.id)}>
                  {filter.label}
                </Button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2 xl:justify-end">
              {sortOptions.map((sort) => {
                const active = activeSort === sort.id
                const Icon = sort.Icon

                return (
                  <Button key={sort.id} type="button" size="sm" variant={active ? "secondary" : "outline"} onClick={() => setActiveSort(sort.id)}>
                    <Icon className={cn("size-4", active ? "text-slate-950" : sort.iconClassName)} aria-hidden="true" />
                    {sort.label}
                  </Button>
                )
              })}
            </div>
          </div>

          <Table>
          <TableHeader>
            <TableRow>
              {selectionMode && <TableHead className="w-10">Select</TableHead>}
              <TableHead>Product</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>Warnings</TableHead>
              <TableHead>Candidates</TableHead>
              <TableHead>Evidence</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleProducts.length === 0 && (
              <TableRow>
                <TableCell colSpan={selectionMode ? 9 : 8} className="py-10 text-center">
                  <div className="mx-auto flex max-w-xl flex-col items-center gap-4">
                    <p className="font-semibold">No products imported yet</p>
                    <p className="text-sm leading-6 text-muted-foreground">
                      Import the electronics catalog, then this triage queue will show scored products for review.
                    </p>
                    <ResetWorkspaceButton compact actions="import" align="center" />
                  </div>
                </TableCell>
              </TableRow>
            )}
            {visibleProducts.map((product) => (
              <TableRow key={product.id}>
                {selectionMode && (
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selectedProductIds.includes(product.id)}
                      onChange={(event) => toggleProductSelection(product.id, event.target.checked)}
                      aria-label={`Select ${product.title} for research`}
                      className="size-4 cursor-pointer rounded border-slate-300 text-blue-600 accent-blue-600"
                    />
                  </TableCell>
                )}
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <span className="font-semibold tracking-[-0.02em]">{product.title}</span>
                    <span className="font-mono text-xs text-muted-foreground">{product.miraklProductId}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{formatEnumLabel(product.listingStatus)}</Badge>
                </TableCell>
                <TableCell className="max-w-72 text-sm text-muted-foreground">{product.categoryPath.join(" / ")}</TableCell>
                <TableCell>
                  <ScoreBadge score={product.qualityScore} band={product.scoreBand} />
                </TableCell>
                <TableCell className={product.warnings.length > 0 ? "font-semibold text-destructive" : undefined}>{product.warnings.length}</TableCell>
                <TableCell>{product.candidates.length}</TableCell>
                <TableCell>{product.evidence.length}</TableCell>
                <TableCell className="text-right">
                  <Button asChild size="sm">
                    <Link href={`/products/${product.id}`}>
                      Review
                      <ArrowRightIcon data-icon="inline-end" />
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          </Table>
        </div>
      </Panel>
    </div>
  )
}
