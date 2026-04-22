"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
    <Card>
      <CardHeader className="gap-4">
        <div className="flex flex-col gap-2">
          <CardTitle>Catalog triage</CardTitle>
          <CardDescription>Start with the weakest Mirakl baselines, then move into evidence-backed candidate review.</CardDescription>
        </div>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-2">
            {filterOptions.map((filter) => (
              <Button key={filter.id} type="button" size="sm" variant={activeFilter === filter.id ? "secondary" : "outline"} onClick={() => setActiveFilter(filter.id)}>
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
      </CardHeader>
      <CardContent>
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
            {visibleProducts.map((product) => (
              <TableRow key={product.id}>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <span className="font-medium">{product.title}</span>
                    <span className="text-xs text-muted-foreground">{product.miraklProductId}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{product.listingStatus}</Badge>
                </TableCell>
                <TableCell>{product.categoryPath.join(" / ")}</TableCell>
                <TableCell>
                  <ScoreBadge score={product.qualityScore} band={product.scoreBand} />
                </TableCell>
                <TableCell>{product.warnings.length}</TableCell>
                <TableCell>{product.candidates.length}</TableCell>
                <TableCell>{product.evidence.length}</TableCell>
                <TableCell className="text-right">
                  <Button asChild size="sm">
                    <Link href={`/products/${product.id}`}>Review</Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
