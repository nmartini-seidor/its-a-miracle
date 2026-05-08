"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { BotIcon, RefreshCwIcon, SparklesIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { beginResearchActivity, endResearchActivity } from "@/components/app/research-activity"
import { cn } from "@/lib/utils"

export function ResearchButton({ productId }: { productId: string }) {
  const router = useRouter()
  const [status, setStatus] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function runResearch() {
    setPending(true)
    setStatus(null)
    beginResearchActivity()

    try {
      const response = await fetch(`/api/products/${productId}/research-jobs`, { method: "POST" })
      const body = await response.json()

      if (!response.ok) {
        setStatus(body.error ?? "Failed")
        return
      }

      let finished = false
      while (!finished) {
        const statusResponse = await fetch(`/api/research-jobs/${body.id}`, { cache: "no-store" })
        const statusBody = await statusResponse.json()

        if (!statusResponse.ok) {
          setStatus(statusBody.error ?? "Research status failed")
          return
        }

        if (statusBody.status === "SUCCEEDED") {
          finished = true
          router.refresh()
          return
        }

        await new Promise((resolve) => setTimeout(resolve, 1000))
      }
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Research failed")
    } finally {
      setPending(false)
      endResearchActivity()
    }
  }

  return (
    <div className="relative flex flex-col items-end gap-2">
      {pending && <span className="research-flight-orb"><SparklesIcon className="size-5" aria-hidden="true" /></span>}
      <Button
        onClick={runResearch}
        disabled={pending}
        className={cn(
          "rounded-xl bg-gradient-to-r from-fuchsia-500 via-violet-500 to-sky-400 px-5 text-white shadow-[0_14px_34px_rgba(168,85,247,0.28)] hover:from-fuchsia-600 hover:via-violet-600 hover:to-sky-500 hover:text-white hover:shadow-[0_18px_42px_rgba(168,85,247,0.34)]",
          pending && "animate-pulse",
        )}
      >
        {pending ? <RefreshCwIcon data-icon="inline-start" className="animate-spin" /> : <BotIcon data-icon="inline-start" />}
        {pending ? "Researching..." : "Run Research Agent"}
      </Button>
      {status && <p className="text-xs text-rose-700">{status}</p>}
    </div>
  )
}
