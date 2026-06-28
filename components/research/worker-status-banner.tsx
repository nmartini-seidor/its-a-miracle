"use client"

import { useEffect, useRef, useState } from "react"
import { CircleCheckIcon, CircleSlashIcon, LoaderCircleIcon, PauseCircleIcon, TriangleAlertIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  countUsableRunners,
  isRunnerLivenessUsable,
  WORKER_HEARTBEAT_MS,
  type RunnerLiveness,
  type WorkerSnapshot,
} from "@/lib/worker-status"

type WorkerStatusResponse = { worker: WorkerSnapshot; researchPaused: boolean }

const RUNNER_LABELS: Record<string, string> = { cursor: "Cursor", codex: "Codex", claude: "Claude" }
const RUNNER_ORDER = ["cursor", "codex", "claude"] as const

// One operator-facing taxonomy (ADR 0006), in priority order: offline (executor unreachable) →
// paused (operator gate) → no usable runners → online (idle / busy on a job).
type Tone = "offline" | "paused" | "warn" | "online"

const TONE_STYLES: Record<Tone, string> = {
  offline: "border-rose-200 bg-rose-50 text-rose-900",
  paused: "border-amber-200 bg-amber-50 text-amber-900",
  warn: "border-amber-200 bg-amber-50 text-amber-900",
  online: "border-emerald-200 bg-emerald-50 text-emerald-900",
}

function runnerDotClass(liveness: RunnerLiveness | undefined): string {
  if (!liveness || !liveness.installed) return "bg-slate-300"
  if (liveness.loggedIn === false) return "bg-amber-500"
  return "bg-emerald-500"
}

function runnerTitle(liveness: RunnerLiveness | undefined): string {
  if (!liveness || !liveness.installed) return "not installed"
  if (liveness.loggedIn === false) return "installed, logged out"
  if (liveness.loggedIn === "unknown") return "installed, login unknown"
  return "installed, logged in"
}

export function WorkerStatusBanner({ initialWorker, initialResearchPaused }: { initialWorker: WorkerSnapshot; initialResearchPaused: boolean }) {
  const [worker, setWorker] = useState<WorkerSnapshot>(initialWorker)
  const [researchPaused, setResearchPaused] = useState(initialResearchPaused)
  // Debounce "down": require two consecutive non-online polls before flipping the banner to
  // offline, so a single post-sleep stale read doesn't flash a scary message (ADR 0006).
  const downReads = useRef(0)

  useEffect(() => {
    let cancelled = false
    async function poll() {
      try {
        const response = await fetch("/api/research/worker-status", { cache: "no-store" })
        if (!response.ok) return
        const body = (await response.json()) as WorkerStatusResponse
        if (cancelled) return
        setResearchPaused(body.researchPaused)
        if (body.worker.state === "online") {
          downReads.current = 0
          setWorker(body.worker)
        } else {
          downReads.current += 1
          if (downReads.current >= 2) setWorker(body.worker)
        }
      } catch {
        // Network blips are ignored; the next tick re-reads.
      }
    }
    const timer = setInterval(poll, WORKER_HEARTBEAT_MS)
    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [])

  const offline = worker.state !== "online"
  const usableRunners = countUsableRunners(worker.runners)

  let tone: Tone
  let Icon = CircleCheckIcon
  let title: string
  let detail: string

  if (offline) {
    tone = "offline"
    Icon = CircleSlashIcon
    title = "Worker not running"
    detail =
      worker.state === "unknown"
        ? "No heartbeat from the research Worker yet. Start it with `pnpm worker` to run research."
        : "The research Worker is offline. Start it with `pnpm worker`; research stays queued until it is back."
  } else if (researchPaused) {
    tone = "paused"
    Icon = PauseCircleIcon
    title = "Research intake paused"
    detail = "New Research Jobs are paused in Settings. Jobs already queued or in flight still finish."
  } else if (usableRunners === 0) {
    tone = "warn"
    Icon = TriangleAlertIcon
    title = "No research runners available"
    detail = "The Worker is online but no runner CLI is installed and logged in. Log in to cursor-agent, codex, or claude."
  } else {
    tone = "online"
    Icon = worker.phase === "busy" ? LoaderCircleIcon : CircleCheckIcon
    title = worker.phase === "busy" ? "Worker online — running research" : "Worker online — idle"
    detail =
      worker.phase === "busy" && worker.currentJobId
        ? `Processing ${worker.currentJobId}. ${usableRunners} runner${usableRunners === 1 ? "" : "s"} ready.`
        : `${usableRunners} runner${usableRunners === 1 ? "" : "s"} ready to research.`
  }

  return (
    <div role="status" aria-live="polite" className={cn("flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between", TONE_STYLES[tone])}>
      <div className="flex items-start gap-3">
        <Icon className={cn("mt-0.5 size-5 shrink-0", worker.phase === "busy" && !offline && !researchPaused && usableRunners > 0 && "animate-spin")} aria-hidden="true" />
        <div className="flex flex-col gap-0.5">
          <p className="text-sm font-semibold">{title}</p>
          <p className="text-xs opacity-90">{detail}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {RUNNER_ORDER.map((runnerId) => {
          const liveness = worker.runners?.[runnerId]
          return (
            <span
              key={runnerId}
              title={`${RUNNER_LABELS[runnerId]}: ${runnerTitle(liveness)}`}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border bg-white/70 px-2.5 py-1 text-xs font-medium text-slate-700",
                liveness && isRunnerLivenessUsable(liveness) ? "border-emerald-200" : "border-slate-200",
              )}
            >
              <span className={cn("size-2 rounded-full", runnerDotClass(liveness))} aria-hidden="true" />
              {RUNNER_LABELS[runnerId]}
            </span>
          )
        })}
      </div>
    </div>
  )
}
