"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { isSectionActive, workspaceSections } from "@/lib/navigation"

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav aria-label="Mobile workspace navigation" className="flex gap-2 overflow-x-auto border-b border-slate-200 bg-white px-4 py-3 md:hidden">
      {workspaceSections.map((item) => (
        <Button key={item.href} asChild size="sm" variant={isSectionActive(pathname, item.href) ? "default" : "outline"} className="shrink-0 rounded-full">
          <Link href={item.href}>{item.label}</Link>
        </Button>
      ))}
    </nav>
  )
}
