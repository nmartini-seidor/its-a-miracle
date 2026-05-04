"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { BotIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

export function ResearchButton({ productId }: { productId: string }) {
  const router = useRouter()
  const [status, setStatus] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function poll(jobId: string) {
    let finished = false

    while (!finished) {
      const response = await fetch(`/api/research-jobs/${jobId}`, { cache: "no-store" })
      const body = await response.json()

      if (!response.ok) {
        setStatus(body.error ?? "Research status failed")
        setPending(false)
        return
      }

      setStatus(`Job ${body.id} · ${body.status}`)
      if (body.status === "SUCCEEDED") {
        finished = true
        setPending(false)
        router.refresh()
        return
      }

      await new Promise((resolve) => setTimeout(resolve, 1000))
    }
  }

  async function runResearch() {
    setPending(true)
    const response = await fetch(`/api/products/${productId}/research-jobs`, { method: "POST" })
    const body = await response.json()

    if (!response.ok) {
      setStatus(body.error ?? "Failed")
      setPending(false)
      return
    }

    setStatus(`Job ${body.id} · ${body.status}`)
    await poll(body.id)
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <Button onClick={runResearch} disabled={pending}>
        <BotIcon data-icon="inline-start" />
        {pending ? "Researching" : "Run Research Agent"}
      </Button>
      {status && <p className="text-xs text-muted-foreground">{status}</p>}
    </div>
  )
}
