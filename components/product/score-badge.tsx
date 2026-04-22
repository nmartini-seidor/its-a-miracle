import { Badge } from "@/components/ui/badge"
import type { ProductScoreBand } from "@/lib/types"
import { cn } from "@/lib/utils"

const scoreBandClassName: Record<ProductScoreBand, string> = {
  red: "border-red-200 bg-red-100 text-red-800",
  yellow: "border-yellow-200 bg-yellow-100 text-yellow-800",
  blue: "border-blue-200 bg-blue-100 text-blue-800",
  green: "border-emerald-200 bg-emerald-100 text-emerald-800"
}

export function ScoreBadge({ score, band, className }: { score: number; band: ProductScoreBand; className?: string }) {
  return <Badge variant="outline" className={cn(scoreBandClassName[band], className)}>{score}/100</Badge>
}
