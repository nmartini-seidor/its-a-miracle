import type { LucideIcon } from "lucide-react"
import { BotIcon, DatabaseIcon, FolderKanbanIcon, PackageSearchIcon, RadioTowerIcon, SettingsIcon } from "lucide-react"
import type { WorkspaceSectionIcon } from "@/lib/navigation"

export const workspaceSectionIcons = {
  products: { Icon: PackageSearchIcon, className: "text-blue-500" },
  catalog: { Icon: DatabaseIcon, className: "text-emerald-500" },
  schemas: { Icon: FolderKanbanIcon, className: "text-violet-500" },
  aggregators: { Icon: RadioTowerIcon, className: "text-amber-500" },
  research: { Icon: BotIcon, className: "text-fuchsia-500" },
  settings: { Icon: SettingsIcon, className: "text-slate-500" },
} satisfies Record<WorkspaceSectionIcon, { Icon: LucideIcon; className: string }>
