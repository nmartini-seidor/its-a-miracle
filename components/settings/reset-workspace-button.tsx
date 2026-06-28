"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { DatabaseIcon, RotateCcwIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getMockProductImportDurationMs } from "@/lib/mock-timing"
import { cn } from "@/lib/utils"

// Presentation-only pacing for the branded progress bar. The import is a single sub-second, atomic
// POST (importDemoProducts) — there is no real per-product stream to report — so we animate a
// time-driven bar toward 90% and then snap to 100% with the REAL imported count from the API. No
// fabricated per-product fraction and no fake "Analyzing…" phase: the bar makes no count claims.
const importDurationMs = getMockProductImportDurationMs()
const PROGRESS_STEPS = 30
const PROGRESS_CEILING = 90

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function ResetWorkspaceButton({
  compact = false,
  actions = "both",
  align = "start",
}: {
  compact?: boolean
  actions?: "both" | "import"
  align?: "start" | "center"
}) {
  const router = useRouter()
  const [status, setStatus] = useState<string | null>(null)
  const [pendingAction, setPendingAction] = useState<"reset" | "import" | null>(null)
  const [importProgress, setImportProgress] = useState(0)

  async function runResetAction() {
    setPendingAction("reset")
    setStatus(null)
    try {
      const response = await fetch("/api/workspace/reset", { method: "POST" })
      // Guard the parse: a non-JSON response (e.g. a 502 HTML page) must not throw and leave the
      // button stuck in "reset" forever — same robustness as runImportAction below.
      const body = await response.json().catch(() => ({}))
      setStatus(response.ok ? body.message ?? "Workspace cleared." : body.error ?? "Workspace action failed")
      if (response.ok) router.refresh()
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Workspace action failed")
    } finally {
      setPendingAction(null)
    }
  }

  async function runImportAction() {
    setPendingAction("import")
    setImportProgress(0)
    setStatus("Importing product data…")

    // Fire the real import immediately; normalize success/failure up front so the awaited result
    // never leaves an unhandled rejection while the branded bar paces toward the ceiling.
    const importRequest = fetch("/api/workspace/import", { method: "POST" }).then(
      async (response) => ({ ok: response.ok, body: await response.json().catch(() => ({})) }),
      (error) => ({ ok: false, body: { error: error instanceof Error ? error.message : "Workspace action failed" } }),
    )

    const stepMs = Math.max(16, Math.round(importDurationMs / PROGRESS_STEPS))
    for (let step = 1; step <= PROGRESS_STEPS; step += 1) {
      await wait(stepMs)
      setImportProgress(Math.min(PROGRESS_CEILING, Math.round((step / PROGRESS_STEPS) * PROGRESS_CEILING)))
    }

    const { ok, body } = await importRequest
    if (!ok) {
      // No fabricated number on the unhappy path — just the real error.
      setStatus(body.error ?? "Workspace action failed")
      setImportProgress(0)
      setPendingAction(null)
      return
    }

    setImportProgress(100)
    setStatus(body.message) // the API's real message, e.g. "Imported N electronics products…"
    setPendingAction(null)
    router.refresh()
  }

  const importing = pendingAction === "import"

  return (
    <div className={cn("flex flex-col gap-3", align === "center" ? "items-center" : "items-start")}>
      <div className={cn("flex flex-wrap gap-2", align === "center" && "justify-center")}>
        {actions === "both" && (
          <Button type="button" variant="outline" onClick={runResetAction} disabled={pendingAction !== null}>
            <RotateCcwIcon data-icon="inline-start" />
            {pendingAction === "reset" ? "Clearing workspace" : "Clear workspace"}
          </Button>
        )}
        <Button type="button" onClick={runImportAction} disabled={pendingAction !== null}>
          <DatabaseIcon data-icon="inline-start" />
          {importing ? "Importing…" : "Import Product data"}
        </Button>
      </div>
      {!compact && (
        <p className="text-sm text-muted-foreground">
          Start empty, import the electronics catalog, then review the products that appear.
        </p>
      )}
      {importing && (
        <div className="w-[min(72rem,calc(100vw-3rem))] max-w-full py-5 text-left">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">Product data import</p>
            <div className="min-w-[6ch] text-right font-mono text-3xl font-semibold tabular-nums tracking-[-0.05em] text-blue-700 sm:text-4xl">{importProgress}%</div>
          </div>
          <div className="h-4 overflow-hidden rounded-full bg-slate-100 shadow-inner" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={importProgress}>
            <div className="h-full rounded-full bg-blue-600 transition-[width] duration-700 ease-out" style={{ width: `${importProgress}%` }} />
          </div>
          <p className="mt-4 min-h-14 w-full text-lg font-medium leading-7 text-slate-800">{status}</p>
        </div>
      )}
      {status && !importing && <p className="text-xs text-muted-foreground">{status}</p>}
    </div>
  )
}
