"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

export function ExportPreviewPanel({ productId }: { productId: string }) {
  const [preview, setPreview] = useState<unknown>(null)
  const [isLoading, setIsLoading] = useState(false)

  async function loadPreview() {
    setIsLoading(true)
    const response = await fetch(`/api/products/${productId}/export-preview`)
    setPreview(await response.json())
    setIsLoading(false)
  }

  return (
    <div className="flex flex-col gap-4">
      <Button className="w-fit" disabled={isLoading} onClick={loadPreview}>{isLoading ? "Generating…" : "Generate draft preview"}</Button>
      {preview ? (
        <pre className="max-h-[32rem] overflow-auto rounded-xl border bg-muted/50 p-4 font-mono text-xs leading-6 text-foreground">{JSON.stringify(preview, null, 2)}</pre>
      ) : (
        <p className="text-sm text-muted-foreground">No preview generated yet.</p>
      )}
    </div>
  )
}
