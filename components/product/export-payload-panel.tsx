"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2Icon, DownloadIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

export function ExportPayloadPanel({
  productId,
  proposedCandidateIds = [],
  acceptedCandidateIds = [],
}: {
  productId: string
  proposedCandidateIds?: string[]
  acceptedCandidateIds?: string[]
}) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isApproving, setIsApproving] = useState(false)

  async function exportPayload() {
    setIsLoading(true)
    const response = await fetch(`/api/products/${productId}/export`)
    const payload = await response.json()
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `${productId}-mirakl-export.json`
    document.body.append(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
    setIsLoading(false)
  }

  async function approveAll() {
    setIsApproving(true)
    for (const candidateId of proposedCandidateIds) {
      await fetch(`/api/candidates/${candidateId}/review-decisions`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ decision: "APPROVE", reason: "Bulk dashboard approval" }),
      })
    }
    setIsApproving(false)
    router.refresh()
  }

  return (
    <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
      <Button type="button" variant="outline" onClick={exportPayload} disabled={isLoading || isApproving || acceptedCandidateIds.length === 0}>
        <DownloadIcon data-icon="inline-start" />
        {isLoading ? "Exporting…" : "Export"}
      </Button>
      <Button type="button" onClick={approveAll} disabled={isLoading || isApproving || proposedCandidateIds.length === 0}>
        <CheckCircle2Icon data-icon="inline-start" />
        {isApproving ? "Approving..." : "Approve ALL"}
      </Button>
    </div>
  )
}
