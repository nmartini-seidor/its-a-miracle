import type { ProductRecord } from "./types.ts"

export type TriageFilterId = "all" | "needs-enrichment" | "with-candidates" | "hero-product"
export type TriageSortId = "score-asc" | "warnings-desc" | "category-asc"

export function filterProducts(products: ProductRecord[], filter: TriageFilterId) {
  switch (filter) {
    case "needs-enrichment":
      return products.filter((product) => product.listingStatus !== "READY_FOR_REVIEW")
    case "with-candidates":
      return products.filter((product) => product.candidates.length > 0)
    case "hero-product":
      return products.filter((product) => product.id === "freeclip-2")
    default:
      return products
  }
}

export function sortProducts(products: ProductRecord[], sort: TriageSortId) {
  return [...products].sort((left, right) => {
    switch (sort) {
      case "warnings-desc":
        return right.warnings.length - left.warnings.length || left.qualityScore - right.qualityScore
      case "category-asc":
        return left.categoryPath.join("/").localeCompare(right.categoryPath.join("/")) || left.title.localeCompare(right.title)
      case "score-asc":
      default:
        return left.qualityScore - right.qualityScore || right.warnings.length - left.warnings.length
    }
  })
}
