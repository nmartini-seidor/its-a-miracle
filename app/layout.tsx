import type { Metadata } from "next"
import Link from "next/link"
import { DatabaseIcon, LayersIcon, PackageIcon, RadioTowerIcon, SettingsIcon, SparklesIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import "./globals.css"

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
      <body>
        <div className="min-h-screen bg-muted/30">
          <aside className="fixed inset-y-0 left-0 hidden w-72 flex-col border-r bg-background/95 p-4 shadow-sm backdrop-blur md:flex">
            <Link href="/" className="group flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-accent">
              <div className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm transition-transform group-hover:scale-105">
                <SparklesIcon data-icon="inline-start" />
              </div>
              <div className="flex flex-col leading-tight">
                <span className="font-semibold tracking-tight">Mirakl Enrichment</span>
                <span className="text-xs text-muted-foreground">Product intelligence</span>
              </div>
            </Link>
            <Separator className="my-4" />
            <nav className="flex flex-col gap-1">
              {navItems.map((item) => {
                const Icon = item.icon
                return (
                  <Button key={item.label} asChild variant={item.label === "Products" ? "secondary" : "ghost"} className="justify-start">
                    <Link href={item.href}>
                      <Icon data-icon="inline-start" />
                      {item.label}
                    </Link>
                  </Button>
                )
              })}
            </nav>
            <div className="mt-auto rounded-xl border bg-card p-4 text-sm text-card-foreground shadow-sm">
              <p className="font-medium">Review-first workflow</p>
              <p className="mt-1 text-muted-foreground">Research creates candidates. Mirakl writes stay approval-gated.</p>
            </div>
          </aside>
          <div className="md:pl-72">
            <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background/85 px-4 backdrop-blur md:px-6">
              <div className="flex items-center gap-3 md:hidden">
                <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <SparklesIcon data-icon="inline-start" />
                </div>
                <span className="font-semibold">Mirakl Enrichment</span>
              </div>
              <div className="hidden flex-col md:flex">
                <span className="text-sm font-medium">Workspace</span>
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
