"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

export function ExportPayloadPanel({ productId }: { productId: string }) {
  const [payload, setPayload] = useState<unknown>(null)
  const [isLoading, setIsLoading] = useState(false)

  async function loadPayload() {
    setIsLoading(true)
    const response = await fetch(`/api/products/${productId}/export`)
    setPayload(await response.json())
    setIsLoading(false)
  }

  return (
    <div className="flex flex-col gap-4">
      <Button className="w-fit" disabled={isLoading} onClick={loadPayload}>{isLoading ? "Generating…" : "Generate export payload"}</Button>
      {payload ? (
        <pre className="max-h-[32rem] overflow-auto rounded-xl border bg-muted/50 p-4 font-mono text-xs leading-6 text-foreground">{JSON.stringify(payload, null, 2)}</pre>
      ) : (
        <p className="text-sm text-muted-foreground">No export payload generated yet.</p>
      )}
    </div>
  )
}
