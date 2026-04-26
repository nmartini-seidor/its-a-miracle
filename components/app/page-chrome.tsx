import type { ReactNode } from "react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type Tone = "default" | "danger" | "warning" | "success"

const toneClassNames: Record<Tone, string> = {
  default: "border-primary/25 bg-primary/7 text-primary",
  danger: "border-destructive/30 bg-destructive/8 text-destructive",
  warning: "border-amber-500/35 bg-amber-500/10 text-amber-800",
  success: "border-accent/35 bg-accent/12 text-accent-foreground",
}

export function PageShell({ children, className }: { children: ReactNode; className?: string }) {
  return <main className={cn("mx-auto flex w-full max-w-[92rem] flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8", className)}>{children}</main>
}

export function PageHeader({
  eyebrow,
  title,
  description,
  badges,
  actions,
}: {
  eyebrow: string
  title: string
  description: string
  badges?: ReactNode
  actions?: ReactNode
}) {
  return (
    <section className="rounded-2xl border bg-card px-5 py-4 shadow-sm sm:px-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="font-mono text-[0.65rem] uppercase tracking-[0.18em]">
              {eyebrow}
            </Badge>
            {badges}
          </div>
          <div className="flex flex-col gap-1">
            <h1 className="max-w-4xl text-2xl font-semibold leading-tight tracking-[-0.02em] text-foreground sm:text-3xl">
              {title}
            </h1>
            <p className="max-w-4xl text-sm leading-6 text-muted-foreground sm:text-base">{description}</p>
          </div>
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2 lg:justify-end">{actions}</div>}
      </div>
    </section>
  )
}

export function MetricStrip({
  metrics,
  columns = "xl:grid-cols-4",
}: {
  metrics: { label: string; value: ReactNode; detail?: ReactNode; tone?: Tone }[]
  columns?: string
}) {
  return (
    <section className={cn("grid overflow-hidden rounded-2xl border bg-card shadow-sm sm:grid-cols-2", columns)}>
      {metrics.map((metric) => (
        <div key={metric.label} className="flex min-h-24 flex-col justify-between gap-3 border-b p-4 last:border-b-0 sm:border-r sm:last:border-r-0 xl:border-b-0">
          <div className="flex items-center justify-between gap-3">
            <p className="font-mono text-[0.68rem] uppercase tracking-[0.16em] text-muted-foreground">{metric.label}</p>
            <span className={cn("size-2 rounded-full border", toneClassNames[metric.tone ?? "default"])} aria-hidden="true" />
          </div>
          <div className="flex items-end justify-between gap-3">
            <div className="text-2xl font-semibold tracking-[-0.02em] text-foreground sm:text-3xl">{metric.value}</div>
            {metric.detail && <p className="max-w-48 text-right text-xs leading-5 text-muted-foreground">{metric.detail}</p>}
          </div>
        </div>
      ))}
    </section>
  )
}

export function Panel({ title, description, children, className }: { title: string; description?: string; children: ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-2xl border bg-card shadow-sm", className)}>
      <div className="flex flex-col gap-1.5 border-b px-5 py-4 sm:px-6">
        <h2 className="text-lg font-semibold tracking-[-0.015em] text-foreground">{title}</h2>
        {description && <p className="max-w-4xl text-sm leading-6 text-muted-foreground">{description}</p>}
      </div>
      <div className="p-5 sm:p-6">{children}</div>
    </section>
  )
}
