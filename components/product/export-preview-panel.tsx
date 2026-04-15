"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

export function ExportPreviewPanel({ productId }: { productId: string }) {
  const [preview, setPreview] = useState<unknown>(null)
  async function loadPreview() {
    const response = await fetch(`/api/products/${productId}/export-preview`)
    setPreview(await response.json())
  }
  return <div className="flex flex-col gap-3"><Button className="w-fit" onClick={loadPreview}>Generate draft preview</Button>{preview ? <pre className="overflow-auto rounded-md border bg-muted p-4 text-xs">{JSON.stringify(preview, null, 2)}</pre> : <p className="text-sm text-muted-foreground">No preview generated yet.</p>}</div>
}
