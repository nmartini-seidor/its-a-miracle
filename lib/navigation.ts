export const workspaceSections = [
  { label: "Products", href: "/" },
  { label: "Catalog", href: "/catalog" },
  { label: "Schemas", href: "/schemas" },
  { label: "Aggregators", href: "/aggregators" },
  { label: "Settings", href: "/settings" },
] as const

export function isSectionActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`)
}
