"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { RefreshCwIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

export function SyncMiraklButton({ productId, canSync = false }: { productId: string; canSync?: boolean }) {
  const router = useRouter()
  const [isSyncing, setIsSyncing] = useState(false)
  const [status, setStatus] = useState<string | null>(null)

  async function syncWithMirakl() {
    setStatus(null)
    setIsSyncing(true)
    const response = await fetch(`/api/products/${productId}/sync`, { method: "POST" })
    const body = await response.json()
    setIsSyncing(false)
    if (response.ok) {
      router.refresh()
      return
    }
    setStatus(body.error ?? "Mirakl sync failed")
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        type="button"
        onClick={syncWithMirakl}
        disabled={isSyncing || !canSync}
        className="border border-blue-700 bg-blue-600 text-white shadow-[0_10px_22px_rgba(37,99,235,0.25)] hover:bg-blue-700 disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none"
      >
        <RefreshCwIcon data-icon="inline-start" className={isSyncing ? "animate-spin" : undefined} />
        {isSyncing ? "Syncing..." : "Sync with Mirakl"}
      </Button>
      {status && <p className="max-w-72 text-right text-xs font-medium text-rose-700">{status}</p>}
    </div>
  )
}
