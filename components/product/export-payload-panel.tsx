"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2Icon, DownloadIcon } from "lucide-react"
import { toast } from "sonner"
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
    try {
      const response = await fetch(`/api/products/${productId}/export`)
      // Guard the response BEFORE parsing — otherwise an error body was downloaded as if it were the
      // real export, with no signal that anything went wrong.
      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        toast.error(body.error ?? `Export failed (HTTP ${response.status}).`)
        return
      }
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
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Export failed.")
    } finally {
      setIsLoading(false)
    }
  }

  async function approveAll() {
    setIsApproving(true)
    // Track per-request failures instead of firing-and-forgetting: a failed approval used to vanish.
    let failures = 0
    for (const candidateId of proposedCandidateIds) {
      try {
        const response = await fetch(`/api/candidates/${candidateId}/review-decisions`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ decision: "APPROVE", reason: "Bulk dashboard approval" }),
        })
        if (!response.ok) failures += 1
      } catch {
        failures += 1
      }
    }
    setIsApproving(false)
    if (failures > 0) toast.error(`${failures} of ${proposedCandidateIds.length} approval(s) failed.`)
    else if (proposedCandidateIds.length > 0) toast.success(`Approved ${proposedCandidateIds.length} candidate value(s).`)
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
