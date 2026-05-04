import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

type Tone = "default" | "danger" | "warning" | "success"

const toneClassNames: Record<Tone, string> = {
  default: "border-blue-500/25 bg-blue-500/10 text-blue-700",
  danger: "border-rose-500/25 bg-rose-500/10 text-rose-700",
  warning: "border-sky-500/25 bg-sky-500/10 text-sky-700",
  success: "border-emerald-500/25 bg-emerald-500/10 text-emerald-700",
}

const metricSurfaceClassNames = [
  "border-slate-200 bg-white shadow-[0_16px_35px_rgba(15,23,42,0.055)]",
  "border-slate-200 bg-white shadow-[0_16px_35px_rgba(15,23,42,0.055)]",
  "border-slate-200 bg-white shadow-[0_16px_35px_rgba(15,23,42,0.055)]",
  "border-slate-200 bg-white shadow-[0_16px_35px_rgba(15,23,42,0.055)]",
]

export function PageShell({ children, className }: { children: ReactNode; className?: string }) {
  return <main id="workspace-main" className={cn("mx-auto flex w-full max-w-[92rem] flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8 lg:py-8", className)}>{children}</main>
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  eyebrow?: string
  title: string
  description?: string
  badges?: ReactNode
  actions?: ReactNode
}) {
  return (
    <section className="px-1 py-1">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <h1 className="max-w-4xl text-2xl font-semibold leading-[1.08] tracking-[-0.035em] text-slate-950 sm:text-[2rem]">
            {title}
          </h1>
          {description && <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{description}</p>}
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
    <section className={cn("grid gap-3 sm:grid-cols-2", columns)}>
      {metrics.map((metric, index) => (
        <div
          key={metric.label}
          className={cn(
            "group flex min-h-24 flex-col justify-between gap-3 rounded-[1.15rem] border p-4 transition-[box-shadow,transform,border-color] duration-200 hover:-translate-y-0.5 hover:border-slate-300",
            metricSurfaceClassNames[index % metricSurfaceClassNames.length],
          )}
        >
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-medium text-slate-500">{metric.label}</p>
            <span className={cn("size-2 rounded-full border", toneClassNames[metric.tone ?? "default"])} aria-hidden="true" />
          </div>
          <div className="flex items-end justify-between gap-3">
            <div className="font-mono text-2xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-3xl">{metric.value}</div>
            {metric.detail && <p className="max-w-48 text-right text-xs leading-5 text-slate-500">{metric.detail}</p>}
          </div>
        </div>
      ))}
    </section>
  )
}

export function Panel({ title, description, children, className }: { title?: string; description?: string; children: ReactNode; className?: string }) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-[1.35rem] border border-slate-200/80 bg-white shadow-[0_22px_55px_rgba(15,23,42,0.06),inset_0_1px_0_rgba(255,255,255,0.9)]",
        className,
      )}
    >
      {title && (
        <div className="flex flex-col gap-1.5 border-b border-slate-200/70 bg-slate-50/70 px-5 py-4 sm:px-6">
          <h2 className="text-lg font-semibold tracking-[-0.025em] text-slate-950">{title}</h2>
          {description && <p className="max-w-4xl text-sm leading-6 text-slate-600">{description}</p>}
        </div>
      )}
      <div className="p-5 sm:p-6">{children}</div>
    </section>
  )
}
