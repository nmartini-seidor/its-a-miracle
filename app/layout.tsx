import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import Link from "next/link"
import { ShieldCheckIcon, SparklesIcon } from "lucide-react"
import { MobileNav } from "@/components/app/mobile-nav"
import { TopNav } from "@/components/app/top-nav"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import "./globals.css"

const geistSans = Geist({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], variable: "--font-sans" })
const geistMono = Geist_Mono({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-mono" })

export const metadata: Metadata = {
  title: "Mirakl Product Enrichment",
  description: "Mirakl enrichment workspace for baseline review, evidence, and candidate approval.",
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className={cn(geistSans.variable, geistMono.variable, "font-sans antialiased")}>
        <a
          href="#workspace-main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-slate-950 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
        >
          Skip to content
        </a>
        <div className="dashboard-surface min-h-screen text-foreground">
          <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/86 px-4 backdrop-blur-xl md:px-6">
            <div className="mx-auto flex min-h-16 w-full max-w-[92rem] items-center justify-between gap-4">
              <Link
                href="/"
                className="group flex cursor-pointer items-center gap-3 rounded-2xl py-2 pr-2 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
              >
                <div className="flex size-10 items-center justify-center rounded-xl bg-slate-950 text-white shadow-[0_12px_30px_rgba(15,23,42,0.18)] transition-transform duration-200 group-hover:-rotate-3">
                  <ShieldCheckIcon className="size-4" />
                </div>
                <div className="flex flex-col leading-tight">
                  <span className="text-sm font-semibold tracking-[-0.02em] text-slate-950">Mirakl Control</span>
                  <span className="text-xs font-medium text-slate-500">Enrichment desk</span>
                </div>
              </Link>

              <TopNav />

              <div className="hidden items-center gap-3 md:flex">
                <div className="hidden flex-col text-right xl:flex">
                  <span className="text-xs font-medium text-slate-500">Review-first workflow</span>
                  <span className="text-sm font-semibold text-slate-950">Baseline · evidence · candidates · export</span>
                </div>
                <Button variant="outline" size="sm" className="rounded-full">
                  <SparklesIcon data-icon="inline-start" />
                  Operator mode
                </Button>
              </div>
            </div>
          </header>
          <MobileNav />
          {children}
        </div>
      </body>
    </html>
  )
}
