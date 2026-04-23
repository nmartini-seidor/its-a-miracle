"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { DatabaseIcon, LayersIcon, PackageIcon, RadioTowerIcon, SettingsIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { isSectionActive, workspaceSections } from "@/lib/navigation"

const sectionIcons = {
  Products: PackageIcon,
  Catalog: DatabaseIcon,
  Schemas: LayersIcon,
  Aggregators: RadioTowerIcon,
  Settings: SettingsIcon,
} as const

export function SidebarNav() {
  const pathname = usePathname()

  return (
    <nav className="flex flex-col gap-1.5 px-1">
      {workspaceSections.map((item) => {
        const Icon = sectionIcons[item.label]
        const isActive = isSectionActive(pathname, item.href)
        return (
          <Button key={item.label} asChild variant={isActive ? "secondary" : "ghost"} className="h-11 justify-start gap-3 rounded-xl px-3 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[active=true]:bg-accent data-[active=true]:text-accent-foreground" data-active={isActive}>
            <Link href={item.href}>
              <Icon data-icon="inline-start" />
              {item.label}
            </Link>
          </Button>
        )
      })}
    </nav>
  )
}
