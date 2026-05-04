"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { isSectionActive, workspaceSections } from "@/lib/navigation"
import { cn } from "@/lib/utils"

export function TopNav() {
  const pathname = usePathname()

  return (
    <nav aria-label="Primary workspace navigation" className="hidden items-center gap-1 rounded-full border border-slate-200/80 bg-white/80 p-1 shadow-[0_10px_28px_rgba(15,23,42,0.06)] backdrop-blur lg:flex">
      {workspaceSections.map((item) => {
        const active = isSectionActive(pathname, item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-full px-3.5 py-2 text-sm font-medium text-slate-600 transition-all duration-200 hover:bg-slate-100 hover:text-slate-950 active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40",
              active && "bg-slate-950 text-white shadow-[0_8px_20px_rgba(15,23,42,0.18)] hover:bg-slate-900 hover:text-white",
            )}
          >
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
