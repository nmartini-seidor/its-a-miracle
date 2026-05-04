"use client"

import Link from "next/link"
import { ArrowRightIcon } from "lucide-react"
import { useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Panel } from "@/components/app/page-chrome"
import { ResetWorkspaceButton } from "@/components/settings/reset-workspace-button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ScoreBadge } from "@/components/product/score-badge"
import { filterProducts, sortProducts, type TriageFilterId, type TriageSortId } from "@/lib/triage"
import type { ProductRecord } from "@/lib/types"

const filterOptions: { id: TriageFilterId; label: string }[] = [
  { id: "all", label: "All products" },
  { id: "needs-enrichment", label: "Needs enrichment" },
  { id: "with-candidates", label: "Has candidates" },
  { id: "hero-product", label: "Hero product" },
]

const sortOptions: { id: TriageSortId; label: string }[] = [
  { id: "score-asc", label: "Lowest score" },
  { id: "warnings-desc", label: "Most warnings" },
  { id: "category-asc", label: "Category" },
]

export function TriageDashboard({ products }: { products: ProductRecord[] }) {
  const [activeFilter, setActiveFilter] = useState<TriageFilterId>("all")
  const [activeSort, setActiveSort] = useState<TriageSortId>("score-asc")

  const visibleProducts = useMemo(() => sortProducts(filterProducts(products, activeFilter), activeSort), [products, activeFilter, activeSort])

  return (
    <Panel
      title="Catalog triage queue"
      description="The table is the workspace now: filter, sort, scan the warnings, then open only the product that needs review."
    >
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {filterOptions.map((filter) => (
              <Button key={filter.id} type="button" size="sm" variant={activeFilter === filter.id ? "default" : "outline"} onClick={() => setActiveFilter(filter.id)}>
                {filter.label}
              </Button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {sortOptions.map((sort) => (
              <Button key={sort.id} type="button" size="sm" variant={activeSort === sort.id ? "secondary" : "outline"} onClick={() => setActiveSort(sort.id)}>
                {sort.label}
              </Button>
            ))}
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
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
                <TableCell colSpan={8} className="py-10 text-center">
                  <div className="mx-auto flex max-w-xl flex-col items-center gap-4">
                    <p className="font-semibold">No products imported yet</p>
                    <p className="text-sm leading-6 text-muted-foreground">
                      Import the Orange electronics catalog, then this triage queue will show scored products for review.
                    </p>
                    <ResetWorkspaceButton compact actions="import" align="center" />
                  </div>
                </TableCell>
              </TableRow>
            )}
            {visibleProducts.map((product) => (
              <TableRow key={product.id}>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <span className="font-semibold tracking-[-0.02em]">{product.title}</span>
                    <span className="font-mono text-xs text-muted-foreground">{product.miraklProductId}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{product.listingStatus}</Badge>
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
  )
}
