"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { DatabaseIcon, RotateCcwIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function ResetWorkspaceButton({
  compact = false,
  actions = "both",
  align = "start",
}: {
  compact?: boolean
  actions?: "both" | "import"
  align?: "start" | "center"
}) {
  const router = useRouter()
  const [status, setStatus] = useState<string | null>(null)
  const [pendingAction, setPendingAction] = useState<"reset" | "import" | null>(null)

  async function runWorkspaceAction(action: "reset" | "import") {
    setPendingAction(action)
    const response = await fetch(`/api/workspace/${action}`, { method: "POST" })
    const body = await response.json()
    setStatus(response.ok ? body.message : body.error ?? "Workspace action failed")
    setPendingAction(null)
    if (response.ok) router.refresh()
  }

  return (
    <div className={cn("flex flex-col gap-3", align === "center" ? "items-center" : "items-start")}>
      <div className={cn("flex flex-wrap gap-2", align === "center" && "justify-center")}>
        {actions === "both" && (
          <Button type="button" variant="outline" onClick={() => runWorkspaceAction("reset")} disabled={pendingAction !== null}>
            <RotateCcwIcon data-icon="inline-start" />
            {pendingAction === "reset" ? "Clearing workspace" : "Clear workspace"}
          </Button>
        )}
        <Button type="button" onClick={() => runWorkspaceAction("import")} disabled={pendingAction !== null}>
          <DatabaseIcon data-icon="inline-start" />
          {pendingAction === "import" ? "Importing catalog" : "Import catalog"}
        </Button>
      </div>
      {!compact && (
        <p className="text-sm text-muted-foreground">
          Start empty, import the electronics catalog, then review the products that appear.
        </p>
      )}
      {status && <p className="text-xs text-muted-foreground">{status}</p>}
    </div>
  )
}
