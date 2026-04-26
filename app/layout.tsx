import type { Metadata } from "next"
import { Fira_Code, Fira_Sans } from "next/font/google"
import Link from "next/link"
import { ShieldCheckIcon } from "lucide-react"
import { MobileNav } from "@/components/app/mobile-nav"
import { SidebarNav } from "@/components/app/sidebar-nav"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import "./globals.css"

const firaSans = Fira_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800", "900"], variable: "--font-sans" })
const firaCode = Fira_Code({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-mono" })

export const metadata: Metadata = {
  title: "Mirakl Product Enrichment",
  description: "Mirakl enrichment workspace for baseline review, evidence, and candidate approval.",
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={cn(firaSans.variable, firaCode.variable, "font-sans antialiased")}>
        <div className="dashboard-surface min-h-screen text-foreground">
          <aside className="fixed inset-y-0 left-0 hidden w-72 flex-col border-r bg-sidebar p-4 text-sidebar-foreground shadow-xl md:flex">
            <Link
              href="/"
              className="group flex cursor-pointer items-center gap-3 rounded-2xl border border-sidebar-border bg-sidebar-accent/35 p-3 transition-colors duration-200 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
            >
              <div className="flex size-12 items-center justify-center rounded-2xl bg-accent text-accent-foreground shadow-sm transition-transform duration-200 group-hover:-rotate-3">
                <ShieldCheckIcon data-icon="inline-start" />
              </div>
              <div className="flex flex-col leading-tight">
                <span className="font-semibold tracking-[-0.02em]">Mirakl <span className="text-accent">Control</span></span>
                <span className="font-mono text-[0.68rem] uppercase tracking-[0.18em] text-sidebar-foreground/65">Enrichment desk</span>
              </div>
            </Link>
            <Separator className="my-5 bg-sidebar-border" />
            <SidebarNav />
            <div className="mt-auto rounded-2xl border border-sidebar-border bg-sidebar-accent/50 p-4 text-sm text-sidebar-accent-foreground shadow-sm">
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-sidebar-foreground/60">Safety state</p>
              <p className="mt-3 font-semibold">Review-first workflow</p>
              <p className="mt-1 text-sidebar-foreground/70">Research creates candidates. Mirakl writes remain approval-gated.</p>
            </div>
          </aside>
          <div className="md:pl-72">
            <header className="sticky top-0 z-10 flex min-h-14 items-center justify-between border-b bg-card/88 px-4 shadow-sm backdrop-blur md:px-6">
              <div className="flex items-center gap-3 md:hidden">
                <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                  <ShieldCheckIcon data-icon="inline-start" />
                </div>
                <span className="font-semibold tracking-[-0.02em]">Mirakl <span className="text-accent">Control</span></span>
              </div>
              <div className="hidden flex-col md:flex">
                <span className="font-mono text-xs uppercase tracking-[0.22em] text-primary">Workspace</span>
                <span className="text-sm text-muted-foreground">Baseline · Evidence · Candidates · Export</span>
              </div>
              <Button variant="outline" size="sm">Operator mode</Button>
            </header>
            <MobileNav />
            {children}
          </div>
        </div>
      </body>
    </html>
  )
}
