"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { workspaceSectionIcons } from "@/components/app/navigation-icons"
import { Button } from "@/components/ui/button"
import { isSectionActive, workspaceSections } from "@/lib/navigation"
import { cn } from "@/lib/utils"

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav aria-label="Mobile workspace navigation" className="flex gap-2 overflow-x-auto border-b border-slate-200 bg-white px-4 py-3 md:hidden">
      {workspaceSections.map((item) => {
        const active = isSectionActive(pathname, item.href)
        const icon = workspaceSectionIcons[item.icon]
        const Icon = icon.Icon

        return (
          <Button key={item.href} asChild size="sm" variant={active ? "default" : "outline"} className="shrink-0 rounded-full">
            <Link href={item.href}>
              <Icon className={cn("size-4", active ? "text-white/90" : icon.className)} aria-hidden="true" />
              {item.label}
            </Link>
          </Button>
        )
      })}
    </nav>
  )
}
