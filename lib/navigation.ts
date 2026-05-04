export type WorkspaceSectionIcon = "products" | "catalog" | "schemas" | "aggregators" | "settings"

export const workspaceSections = [
  { label: "Products", href: "/", icon: "products" },
  { label: "Catalog", href: "/catalog", icon: "catalog" },
  { label: "Schemas", href: "/schemas", icon: "schemas" },
  { label: "Aggregators", href: "/aggregators", icon: "aggregators" },
  { label: "Settings", href: "/settings", icon: "settings" },
] as const

export function isSectionActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`)
}
