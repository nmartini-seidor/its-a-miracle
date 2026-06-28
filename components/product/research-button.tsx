"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { BotIcon, CheckCircle2Icon, ClockIcon, Loader2Icon, RefreshCwIcon, SparklesIcon, XCircleIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { beginResearchActivity, endResearchActivity } from "@/components/app/research-activity"
import { cn } from "@/lib/utils"

type RunnerLane = {
  runner: string
  status: string
  summary: string
  candidates: number
}

const RUNNER_LABELS: Record<string, string> = { cursor: "Cursor", codex: "Codex", claude: "Claude" }
const TERMINAL = new Set(["SUCCEEDED", "FAILED", "TIMEOUT", "CANCELLED"])

function LaneIcon({ status }: { status: string }) {
  if (status === "SUCCEEDED") return <CheckCircle2Icon className="size-4 text-emerald-600" aria-hidden="true" />
  if (status === "RUNNING") return <Loader2Icon className="size-4 animate-spin text-violet-600" aria-hidden="true" />
  if (TERMINAL.has(status)) return <XCircleIcon className="size-4 text-rose-600" aria-hidden="true" />
  return <ClockIcon className="size-4 text-slate-400" aria-hidden="true" />
}

// Hard client-side backstop on the poll loop (ADR 0006) so the button can never spin forever, even
// if every server-side liveness signal somehow fails.
const MAX_POLL_MS = 12 * 60 * 1000

export function ResearchButton({ productId, researchPaused = false }: { productId: string; researchPaused?: boolean }) {
  const router = useRouter()
  const [status, setStatus] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [lanes, setLanes] = useState<RunnerLane[]>([])

  async function runResearch() {
    setPending(true)
    setStatus(null)
    setLanes([])
    beginResearchActivity()

    try {
      const response = await fetch(`/api/products/${productId}/research-jobs`, { method: "POST" })
      const body = await response.json()

      if (!response.ok) {
        // The enqueue guard already classified the failure (worker offline / no runners / paused);
        // surface its specific message rather than a generic "Failed".
        setStatus(body.error ?? "Failed")
        return
      }

      const terminalStatuses = new Set(["SUCCEEDED", "FAILED", "TIMEOUT", "CANCELLED"])
      const startedAt = Date.now()
      let downReads = 0
      let finished = false
      while (!finished) {
        const statusResponse = await fetch(`/api/research-jobs/${body.id}`, { cache: "no-store" })
        const statusBody = await statusResponse.json()

        if (!statusResponse.ok) {
          setStatus(statusBody.error ?? "Research status failed")
          return
        }

        if (Array.isArray(statusBody.runs)) {
          setLanes(statusBody.runs.map((run: RunnerLane) => ({ runner: run.runner, status: run.status, summary: run.summary, candidates: run.candidates ?? 0 })))
        }

        if (terminalStatuses.has(statusBody.status)) {
          finished = true
          if (statusBody.status !== "SUCCEEDED") setStatus(statusBody.summary ?? `Research ${String(statusBody.status).toLowerCase()}`)
          router.refresh()
          return
        }

        // Worker-liveness backstop: if the Worker stops while this job is QUEUED/RUNNING it would
        // never progress. Debounce two consecutive non-online reads (a single post-sleep stale read
        // shouldn't flash a scary message) before giving up so the button never spins silently.
        if (statusBody.worker && statusBody.worker.state !== "online") {
          downReads += 1
          if (downReads >= 2) {
            setStatus("Worker not running — start it with `pnpm worker`, then run research again.")
            router.refresh()
            return
          }
        } else {
          downReads = 0
        }

        if (Date.now() - startedAt > MAX_POLL_MS) {
          setStatus("Research is taking longer than expected. Check the Worker logs, then try again.")
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
        disabled={pending || researchPaused}
        title={researchPaused ? "Research intake is paused in Settings" : undefined}
        className={cn(
          "rounded-xl bg-gradient-to-r from-fuchsia-500 via-violet-500 to-sky-400 px-5 text-white shadow-[0_14px_34px_rgba(168,85,247,0.28)] hover:from-fuchsia-600 hover:via-violet-600 hover:to-sky-500 hover:text-white hover:shadow-[0_18px_42px_rgba(168,85,247,0.34)]",
          pending && "animate-pulse",
        )}
      >
        {pending ? <RefreshCwIcon data-icon="inline-start" className="animate-spin" /> : <BotIcon data-icon="inline-start" />}
        {pending ? "Researching..." : "Run Research Agent"}
      </Button>

      {/* Paused intake is shown distinctly from a worker-down error (amber note vs rose error text)
          so the operator never confuses an intentional pause with the executor being offline. */}
      {researchPaused && !pending && <p className="text-xs font-medium text-amber-700">Research paused in Settings</p>}

      {lanes.length > 0 && (
        <div className="w-full min-w-64 rounded-xl border border-slate-200 bg-white/90 p-2 text-left shadow-sm">
          <p className="px-1 pb-1 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-slate-500">Runner agents</p>
          <ul className="flex flex-col gap-1">
            {lanes.map((lane) => (
              <li key={lane.runner} className="flex items-center gap-2 rounded-lg px-1.5 py-1 text-sm">
                <LaneIcon status={lane.status} />
                <span className="w-14 font-semibold text-slate-800">{RUNNER_LABELS[lane.runner] ?? lane.runner}</span>
                <span className="flex-1 truncate text-xs text-slate-500">{lane.summary}</span>
                {lane.status === "SUCCEEDED" && lane.candidates > 0 && (
                  <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[0.68rem] font-bold text-emerald-700">{lane.candidates}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {status && <p className="text-xs text-rose-700">{status}</p>}
    </div>
  )
}
