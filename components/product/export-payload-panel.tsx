"use client"

import { useState } from "react"
import { DownloadIcon, RefreshCwIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

export function ExportPayloadPanel({ productId }: { productId: string }) {
  const [isLoading, setIsLoading] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)

  async function exportPayload() {
    setIsLoading(true)
    const response = await fetch(`/api/products/${productId}/export`)
    const payload = await response.json()
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `${productId}-mirakl-export.json`
    document.body.append(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
    setIsLoading(false)
  }

  async function syncWithMirakl() {
    setIsSyncing(true)
    await new Promise((resolve) => window.setTimeout(resolve, 900))
    setIsSyncing(false)
  }

  return (
    <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
      <Button type="button" variant="outline" onClick={exportPayload} disabled={isLoading || isSyncing}>
        <DownloadIcon data-icon="inline-start" />
        {isLoading ? "Exporting…" : "Export"}
      </Button>
      <Button type="button" onClick={syncWithMirakl} disabled={isLoading || isSyncing}>
        <RefreshCwIcon data-icon="inline-start" />
        {isSyncing ? "Syncing…" : "Sync"}
      </Button>
    </div>
  )
}
