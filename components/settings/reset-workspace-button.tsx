"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { DatabaseIcon, RotateCcwIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const fakeImportProductCount = 55
const fakeImportDurationMs = 30_000
const fakeQualityAnalysisDurationMs = 5_000
const fakeProductImportDurationMs = fakeImportDurationMs - fakeQualityAnalysisDurationMs
const fakeImportStepMs = Math.ceil(fakeProductImportDurationMs / fakeImportProductCount)
const fakeQualityAnalysisSteps = 5

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
  const [importedProducts, setImportedProducts] = useState(0)
  const [importProgress, setImportProgress] = useState(0)

  async function runResetAction() {
    setPendingAction("reset")
    setStatus(null)
    const response = await fetch("/api/workspace/reset", { method: "POST" })
    const body = await response.json()
    setStatus(response.ok ? body.message : body.error ?? "Workspace action failed")
    setPendingAction(null)
    if (response.ok) router.refresh()
  }

  async function runImportAction() {
    setPendingAction("import")
    setImportedProducts(0)
    setImportProgress(0)
    setStatus(`Found ${fakeImportProductCount} products. Preparing import…`)

    for (let productIndex = 1; productIndex <= fakeImportProductCount; productIndex += 1) {
      await wait(fakeImportStepMs)
      setImportedProducts(productIndex)
      setImportProgress(Math.round((productIndex / fakeImportProductCount) * 85))
      setStatus(`Found ${fakeImportProductCount} products. Importing product ${productIndex}/${fakeImportProductCount}…`)
    }

    for (let analysisStep = 1; analysisStep <= fakeQualityAnalysisSteps; analysisStep += 1) {
      await wait(fakeQualityAnalysisDurationMs / fakeQualityAnalysisSteps)
      setImportProgress(85 + analysisStep * 3)
      setStatus(`Analyzing Product Data Quality… checking completeness, warnings, and candidate readiness ${analysisStep}/${fakeQualityAnalysisSteps}.`)
    }

    setStatus("Finalizing product data import…")
    const response = await fetch("/api/workspace/import", { method: "POST" })
    const body = await response.json()

    if (!response.ok) {
      setStatus(body.error ?? "Workspace action failed")
      setPendingAction(null)
      return
    }

    setImportedProducts(body.importedCount ?? fakeImportProductCount)
    setImportProgress(100)
    setStatus(body.message)
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
          {importing ? `Importing ${importedProducts}/${fakeImportProductCount}` : "Import Product data"}
        </Button>
      </div>
      {!compact && (
        <p className="text-sm text-muted-foreground">
          Start empty, import the electronics catalog, then review the products that appear.
        </p>
      )}
      {importing && (
        <div className="w-full py-5 text-left">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">Product data import</p>
            <div className="font-mono text-3xl font-semibold tracking-[-0.05em] text-blue-700 sm:text-4xl">{importProgress}%</div>
          </div>
          <div className="h-4 overflow-hidden rounded-full bg-slate-100 shadow-inner" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={importProgress}>
            <div className="h-full rounded-full bg-blue-600 transition-[width] duration-700 ease-out" style={{ width: `${importProgress}%` }} />
          </div>
          <p className="mt-4 text-lg font-medium leading-7 text-slate-800">{status}</p>
        </div>
      )}
      {status && !importing && <p className="text-xs text-muted-foreground">{status}</p>}
    </div>
  )
}
