import { Badge } from "@/components/ui/badge"
import { getAuthorityTier } from "@/lib/aggregator-policy"
import { cn } from "@/lib/utils"

export function AuthorityTierBadge({ authorityScore, className }: { authorityScore: number; className?: string }) {
  const tier = getAuthorityTier(authorityScore)
  return <Badge variant="outline" className={cn(tier.badgeClassName, className)}>{tier.label}</Badge>
}

export function AuthorityScoreMeter({ authorityScore }: { authorityScore: number }) {
  const tier = getAuthorityTier(authorityScore)
  return (
    <div className="flex min-w-40 flex-col gap-2">
      <div className="flex items-center justify-between gap-3 text-xs font-medium text-slate-600">
        <span>Authority</span>
        <span>{authorityScore}/100</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div className={cn("h-full rounded-full", tier.id === "canonical-anchor" && "bg-emerald-500", tier.id === "trusted-specialist" && "bg-blue-500", tier.id === "corroborating-source" && "bg-amber-500", tier.id === "supporting-only" && "bg-rose-500")} style={{ width: `${authorityScore}%` }} />
      </div>
    </div>
  )
}
