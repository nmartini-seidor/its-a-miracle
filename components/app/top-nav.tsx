"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { SparklesIcon } from "lucide-react"
import { workspaceSectionIcons } from "@/components/app/navigation-icons"
import { useResearchActivity } from "@/components/app/research-activity"
import { isSectionActive, workspaceSections } from "@/lib/navigation"
import { cn } from "@/lib/utils"

export function TopNav() {
  const pathname = usePathname()
  const researchActive = useResearchActivity()

  return (
    <nav aria-label="Primary workspace navigation" className="hidden items-center gap-1 rounded-full border border-slate-200/80 bg-white/80 p-1 shadow-[0_10px_28px_rgba(15,23,42,0.06)] backdrop-blur lg:flex">
      {workspaceSections.map((item) => {
        const active = isSectionActive(pathname, item.href)
        const icon = workspaceSectionIcons[item.icon]
        const Icon = icon.Icon
        const researchRunning = item.icon === "research" && researchActive

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-medium text-slate-600 transition-all duration-200 hover:bg-slate-100 hover:text-slate-950 active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40",
              active && "bg-slate-950 text-white shadow-[0_8px_20px_rgba(15,23,42,0.18)] hover:bg-slate-900 hover:text-white",
              researchRunning && "research-nav-active bg-gradient-to-r from-fuchsia-500 via-violet-500 to-sky-400 text-white shadow-[0_12px_32px_rgba(168,85,247,0.32)] hover:text-white",
            )}
          >
            <span className="relative inline-flex items-center">
              <Icon className={cn("size-4", active || researchRunning ? "text-white/90" : icon.className)} aria-hidden="true" />
              {researchRunning && <SparklesIcon className="absolute -right-2 -top-2 size-3 animate-pulse text-white" aria-hidden="true" />}
            </span>
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
