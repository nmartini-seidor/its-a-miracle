"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2Icon, RefreshCwIcon, UploadCloudIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

type SyncResult = { importId?: string | number; importStatus?: string; syncedFields?: string[] }

function readImportStatus(raw: unknown): string | undefined {
  if (raw && typeof raw === "object" && "import_status" in raw) return String((raw as { import_status: unknown }).import_status)
  return undefined
}

export function SyncMiraklButton({ productId, canSync = false }: { productId: string; canSync?: boolean }) {
  const router = useRouter()
  const [phase, setPhase] = useState<"idle" | "confirm" | "syncing" | "done">("idle")
  const [status, setStatus] = useState<string | null>(null)
  const [result, setResult] = useState<SyncResult | null>(null)

  async function syncWithMirakl() {
    setStatus(null)
    setPhase("syncing")
    const response = await fetch(`/api/products/${productId}/sync`, { method: "POST" })
    const body = await response.json()
    if (response.ok) {
      setResult({ importId: body.miraklImportId, importStatus: readImportStatus(body.miraklImportStatus), syncedFields: body.syncedFields })
      setPhase("done")
      router.refresh()
      return
    }
    setPhase("idle")
    setStatus(body.error ?? "Mirakl sync failed")
  }

  if (phase === "done" && result) {
    return (
      <div className="flex max-w-72 flex-col items-end gap-1 text-right">
        <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-200">
          <CheckCircle2Icon className="size-4" aria-hidden="true" />
          Submitted to Mirakl dev tenant
        </span>
        <span className="text-xs text-slate-500">
          import #{String(result.importId)}{result.importStatus ? ` · ${result.importStatus}` : ""} · {result.syncedFields?.length ?? 0} field(s)
        </span>
      </div>
    )
  }

  if (phase === "confirm") {
    return (
      <div className="flex max-w-80 flex-col items-end gap-1.5 text-right">
        <p className="text-xs font-medium text-slate-600">Submit accepted values to the Mirakl <span className="font-semibold">dev tenant</span>? This sends a real product import.</p>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" onClick={() => setPhase("idle")}>Cancel</Button>
          <Button
            type="button"
            onClick={syncWithMirakl}
            className="border border-blue-700 bg-blue-600 text-white shadow-[0_10px_22px_rgba(37,99,235,0.25)] hover:bg-blue-700"
          >
            <UploadCloudIcon data-icon="inline-start" />
            Confirm submit
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        type="button"
        onClick={() => setPhase("confirm")}
        disabled={phase === "syncing" || !canSync}
        className="border border-blue-700 bg-blue-600 text-white shadow-[0_10px_22px_rgba(37,99,235,0.25)] hover:bg-blue-700 disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none"
      >
        <RefreshCwIcon data-icon="inline-start" className={phase === "syncing" ? "animate-spin" : undefined} />
        {phase === "syncing" ? "Syncing..." : "Sync"}
      </Button>
      {status && <p className="max-w-72 text-right text-xs font-medium text-rose-700">{status}</p>}
    </div>
  )
}
