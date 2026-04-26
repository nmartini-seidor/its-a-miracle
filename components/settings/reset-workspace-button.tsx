"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { RotateCcwIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

export function ResetWorkspaceButton() {
  const router = useRouter()
  const [status, setStatus] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function handleReset() {
    setPending(true)
    const response = await fetch("/api/workspace/reset", { method: "POST" })
    const body = await response.json()
    setStatus(response.ok ? body.message : body.error ?? "Reset failed")
    setPending(false)
    if (response.ok) router.refresh()
  }

  return (
    <div className="flex flex-col items-start gap-3">
      <Button type="button" variant="outline" onClick={handleReset} disabled={pending}>
        <RotateCcwIcon data-icon="inline-start" />
        {pending ? "Resetting workspace" : "Reset workspace state"}
      </Button>
      <p className="text-sm text-muted-foreground">
        Restore the workspace state so the review flow can be run again.
      </p>
      {status && <p className="text-xs text-muted-foreground">{status}</p>}
    </div>
  )
}
