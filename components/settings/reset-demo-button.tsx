"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { RotateCcwIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

export function ResetDemoButton() {
  const router = useRouter()
  const [status, setStatus] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function handleReset() {
    setPending(true)
    const response = await fetch("/api/demo/reset", { method: "POST" })
    const body = await response.json()
    setStatus(response.ok ? body.message : body.error ?? "Reset failed")
    setPending(false)
    if (response.ok) router.refresh()
  }

  return (
    <div className="flex flex-col items-start gap-3">
      <Button type="button" variant="outline" onClick={handleReset} disabled={pending}>
        <RotateCcwIcon data-icon="inline-start" />
        {pending ? "Resetting demo" : "Reset demo state"}
      </Button>
      <p className="text-sm text-muted-foreground">
        Rebuild the local demo from the seeded fixtures in <code>data/demo-state.json</code> so you can run the walkthrough again.
      </p>
      {status && <p className="text-xs text-muted-foreground">{status}</p>}
    </div>
  )
}
