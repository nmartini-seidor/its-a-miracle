import type { Metadata } from "next"
import { DM_Sans } from "next/font/google"
import Link from "next/link"
import { DatabaseIcon, LayersIcon, PackageIcon, RadioTowerIcon, SettingsIcon, SparklesIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import "./globals.css"

const dmSans = DM_Sans({ subsets: ["latin"], weight: ["400", "500", "700"], variable: "--font-sans" })

export const metadata: Metadata = {
  title: "Mirakl Product Enrichment",
  description: "Review Mirakl baselines, Orange source data, and evidence-backed enrichment candidates."
}

const navItems = [
  { label: "Products", href: "/", icon: PackageIcon },
  { label: "Catalog", href: "/", icon: DatabaseIcon },
  { label: "Schemas", href: "/", icon: LayersIcon },
  { label: "Aggregators", href: "/", icon: RadioTowerIcon },
  { label: "Settings", href: "/", icon: SettingsIcon }
]

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={cn(dmSans.variable, "font-sans antialiased")}>
        <div className="dashboard-surface min-h-screen text-foreground">
          <aside className="fixed inset-y-0 left-0 hidden w-72 flex-col border-r bg-sidebar p-4 text-sidebar-foreground shadow-sm md:flex">
            <Link href="/" className="group flex cursor-pointer items-center gap-3 rounded-xl p-2 transition-colors duration-200 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm transition-transform duration-200 group-hover:scale-105">
                <SparklesIcon data-icon="inline-start" />
              </div>
              <div className="flex flex-col leading-tight">
                <span className="font-semibold tracking-tight">Mirakl Enrichment</span>
                <span className="text-xs text-sidebar-foreground/70">Product intelligence</span>
              </div>
            </Link>
            <Separator className="my-4 bg-sidebar-border" />
            <nav className="flex flex-col gap-1.5 px-1">
              {navItems.map((item) => {
                const Icon = item.icon
                return (
                  <Button key={item.label} asChild variant={item.label === "Products" ? "secondary" : "ghost"} className="justify-start gap-3 px-3">
                    <Link href={item.href}>
                      <Icon data-icon="inline-start" />
                      {item.label}
                    </Link>
                  </Button>
                )
              })}
            </nav>
            <div className="mt-auto rounded-xl border border-sidebar-border bg-sidebar-accent/70 p-4 text-sm text-sidebar-accent-foreground shadow-sm">
              <p className="font-medium">Review-first workflow</p>
              <p className="mt-1 text-sidebar-foreground/70">Research creates candidates. Mirakl writes stay approval-gated.</p>
            </div>
          </aside>
          <div className="md:pl-72">
            <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-card/90 px-4 shadow-sm backdrop-blur md:px-6">
              <div className="flex items-center gap-3 md:hidden">
                <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <SparklesIcon data-icon="inline-start" />
                </div>
                <span className="font-semibold">Mirakl Enrichment</span>
              </div>
              <div className="hidden flex-col md:flex">
                <span className="text-sm font-medium text-primary">Workspace</span>
                <span className="text-xs text-muted-foreground">Baseline, evidence, candidates, review</span>
              </div>
              <Button variant="outline" size="sm">Preview mode</Button>
            </header>
            {children}
          </div>
        </div>
      </body>
    </html>
  )
}
