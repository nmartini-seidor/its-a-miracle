"use client"

import { useState } from "react"
import { SearchIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

export function ResearchButton({ productId }: { productId: string }) {
  const [status, setStatus] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  async function runResearch() {
    setPending(true)
    const response = await fetch(`/api/products/${productId}/research-jobs`, { method: "POST" })
    const body = await response.json()
    setStatus(response.ok ? `Queued ${body.job_id}` : body.error ?? "Failed")
    setPending(false)
  }
  return <div className="flex flex-col items-end gap-2"><Button onClick={runResearch} disabled={pending}><SearchIcon data-icon="inline-start" />{pending ? "Researching" : "Research missing info"}</Button>{status && <p className="text-xs text-muted-foreground">{status}</p>}</div>
}
