"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { isSectionActive, workspaceSections } from "@/lib/navigation"

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="flex gap-2 overflow-x-auto border-b bg-card/95 px-4 py-3 shadow-sm md:hidden">
      {workspaceSections.map((item) => (
        <Button key={item.href} asChild size="sm" variant={isSectionActive(pathname, item.href) ? "secondary" : "outline"} className="shrink-0 rounded-xl">
          <Link href={item.href}>{item.label}</Link>
        </Button>
      ))}
    </nav>
  )
}
