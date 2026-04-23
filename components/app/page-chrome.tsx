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
  return <main className={cn("mx-auto flex w-full max-w-[96rem] flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8", className)}>{children}</main>
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
    <section className="overflow-hidden rounded-[2rem] border bg-card shadow-sm">
      <div className="grid gap-0 lg:grid-cols-[1fr_20rem]">
        <div className="flex flex-col gap-6 p-6 sm:p-8 lg:p-10">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="font-mono uppercase tracking-[0.24em]">
              {eyebrow}
            </Badge>
            {badges}
          </div>
          <div className="flex flex-col gap-3">
            <h1 className="max-w-5xl text-4xl font-black leading-[0.95] tracking-[-0.06em] text-foreground sm:text-6xl lg:text-7xl">
              {title}
            </h1>
            <p className="max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg">{description}</p>
          </div>
        </div>
        <div className="flex min-h-44 flex-col justify-between border-t bg-foreground p-6 text-background lg:border-l lg:border-t-0">
          <p className="font-mono text-xs uppercase tracking-[0.28em] text-background/65">Operator mode</p>
          <div className="flex flex-col gap-4">
            <div className="h-px bg-background/20" />
            <p className="max-w-64 text-sm leading-6 text-background/80">Preview-only controls. Evidence and export actions stay local until approval.</p>
            {actions}
          </div>
        </div>
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
        <div key={metric.label} className="flex min-h-36 flex-col justify-between gap-4 border-b p-5 last:border-b-0 sm:border-r sm:last:border-r-0 xl:border-b-0">
          <div className="flex items-center justify-between gap-3">
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">{metric.label}</p>
            <span className={cn("size-2 rounded-full border", toneClassNames[metric.tone ?? "default"])} aria-hidden="true" />
          </div>
          <div className="flex flex-col gap-1">
            <div className="text-4xl font-black tracking-[-0.05em] text-foreground sm:text-5xl">{metric.value}</div>
            {metric.detail && <p className="max-w-xs text-sm leading-6 text-muted-foreground">{metric.detail}</p>}
          </div>
        </div>
      ))}
    </section>
  )
}

export function Panel({ title, description, children, className }: { title: string; description?: string; children: ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-2xl border bg-card shadow-sm", className)}>
      <div className="flex flex-col gap-2 border-b p-5 sm:p-6">
        <h2 className="text-xl font-black tracking-[-0.03em] text-foreground">{title}</h2>
        {description && <p className="max-w-4xl text-sm leading-6 text-muted-foreground">{description}</p>}
      </div>
      <div className="p-5 sm:p-6">{children}</div>
    </section>
  )
}
