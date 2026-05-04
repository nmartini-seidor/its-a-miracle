"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import type { CandidateStatus } from "@/lib/types"
import { cn } from "@/lib/utils"

function decisionLabel(status: CandidateStatus | "Failed") {
  if (status === "accepted") return "Approved"
  if (status === "rejected") return "Rejected"
  if (status === "Failed") return "Failed"
  return null
}

export function CandidateActions({ candidateId, status: initialStatus }: { candidateId: string; status: CandidateStatus }) {
  const router = useRouter()
  const [status, setStatus] = useState<CandidateStatus | "Failed">(initialStatus)
  const [pendingDecision, setPendingDecision] = useState<"APPROVE" | "REJECT" | null>(null)
  const finalLabel = decisionLabel(status)

  async function decide(decision: "APPROVE" | "REJECT") {
    setPendingDecision(decision)
    const response = await fetch(`/api/candidates/${candidateId}/review-decisions`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ decision, reason: "Dashboard review action" }),
    })

    setPendingDecision(null)
    if (!response.ok) {
      setStatus("Failed")
      return
    }

    setStatus(decision === "APPROVE" ? "accepted" : "rejected")
    router.refresh()
  }

  if (finalLabel) {
    return (
      <div className="flex items-center lg:justify-end">
        <span
          className={cn(
            "inline-flex rounded-md px-2.5 py-1 text-xs font-semibold ring-1",
            status === "accepted" && "bg-emerald-50 text-emerald-800 ring-emerald-200",
            status === "rejected" && "bg-rose-50 text-rose-800 ring-rose-200",
            status === "Failed" && "bg-amber-50 text-amber-800 ring-amber-200",
          )}
          role="status"
        >
          {finalLabel}
        </span>
      </div>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-2 lg:justify-end">
      <Button size="sm" disabled={pendingDecision !== null} onClick={() => decide("APPROVE")}>{pendingDecision === "APPROVE" ? "Approving…" : "Approve"}</Button>
      <Button size="sm" variant="outline" disabled={pendingDecision !== null} onClick={() => decide("REJECT")}>{pendingDecision === "REJECT" ? "Rejecting…" : "Reject"}</Button>
    </div>
  )
}
