"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

export function CandidateActions({ candidateId }: { candidateId: string }) {
  const router = useRouter()
  const [status, setStatus] = useState<string | null>(null)

  async function decide(decision: "APPROVE" | "REJECT" | "REQUEST_MORE_EVIDENCE") {
    const response = await fetch(`/api/candidates/${candidateId}/review-decisions`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ decision, reason: "Dashboard review action" }),
    })
    setStatus(response.ok ? decision : "Failed")
    if (response.ok) router.refresh()
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button size="sm" onClick={() => decide("APPROVE")}>Accept</Button>
      <Button size="sm" variant="outline" onClick={() => decide("REJECT")}>Reject</Button>
      <Button size="sm" variant="secondary" onClick={() => decide("REQUEST_MORE_EVIDENCE")}>More evidence</Button>
      {status && <span className="text-xs text-muted-foreground">{status}</span>}
    </div>
  )
}
