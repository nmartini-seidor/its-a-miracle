"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

export function CandidateActions({ candidateId }: { candidateId: string }) {
  const router = useRouter()
  const [status, setStatus] = useState<string | null>(null)
  const [pendingDecision, setPendingDecision] = useState<"APPROVE" | "REJECT" | "REQUEST_MORE_EVIDENCE" | null>(null)

  async function decide(decision: "APPROVE" | "REJECT" | "REQUEST_MORE_EVIDENCE") {
    setPendingDecision(decision)
    const response = await fetch(`/api/candidates/${candidateId}/review-decisions`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ decision, reason: "Dashboard review action" }),
    })
    setStatus(response.ok ? decision : "Failed")
    setPendingDecision(null)
    if (response.ok) router.refresh()
  }

  return (
    <div className="flex flex-wrap items-center gap-2 lg:justify-end">
      <Button size="sm" disabled={pendingDecision !== null} onClick={() => decide("APPROVE")}>{pendingDecision === "APPROVE" ? "Accepting…" : "Accept"}</Button>
      <Button size="sm" variant="outline" disabled={pendingDecision !== null} onClick={() => decide("REJECT")}>{pendingDecision === "REJECT" ? "Rejecting…" : "Reject"}</Button>
      <Button size="sm" variant="secondary" disabled={pendingDecision !== null} onClick={() => decide("REQUEST_MORE_EVIDENCE")}>{pendingDecision === "REQUEST_MORE_EVIDENCE" ? "Requesting…" : "More evidence"}</Button>
      {status && <span className="font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground" role="status">{status}</span>}
    </div>
  )
}
