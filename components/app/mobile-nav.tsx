"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { SparklesIcon } from "lucide-react"
import { workspaceSectionIcons } from "@/components/app/navigation-icons"
import { useResearchActivity } from "@/components/app/research-activity"
import { Button } from "@/components/ui/button"
import { isSectionActive, workspaceSections } from "@/lib/navigation"
import { cn } from "@/lib/utils"

export function MobileNav() {
  const pathname = usePathname()
  const researchActive = useResearchActivity()

  return (
    <nav aria-label="Mobile workspace navigation" className="flex gap-2 overflow-x-auto border-b border-slate-200 bg-white px-4 py-3 md:hidden">
      {workspaceSections.map((item) => {
        const active = isSectionActive(pathname, item.href)
        const icon = workspaceSectionIcons[item.icon]
        const Icon = icon.Icon
        const researchRunning = item.icon === "research" && researchActive

        return (
          <Button key={item.href} asChild size="sm" variant={active || researchRunning ? "default" : "outline"} className={cn("shrink-0 rounded-full", researchRunning && "research-nav-active bg-gradient-to-r from-fuchsia-500 via-violet-500 to-sky-400 text-white")}>
            <Link href={item.href}>
              <span className="relative inline-flex items-center">
                <Icon className={cn("size-4", active || researchRunning ? "text-white/90" : icon.className)} aria-hidden="true" />
                {researchRunning && <SparklesIcon className="absolute -right-2 -top-2 size-3 animate-pulse text-white" aria-hidden="true" />}
              </span>
              {item.label}
            </Link>
          </Button>
        )
      })}
    </nav>
  )
}
