import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import Image from "next/image"
import Link from "next/link"
import { UserRoundIcon } from "lucide-react"
import { MobileNav } from "@/components/app/mobile-nav"
import { TopNav } from "@/components/app/top-nav"
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
                aria-label="Home"
                className="group flex h-16 cursor-pointer items-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
              >
                <Image
                  src="/data-harbor-logo.svg?v=full-crop-20260508"
                  alt=""
                  width={523}
                  height={350}
                  priority
                  className="h-14 w-auto object-contain transition-transform duration-200 group-hover:scale-[1.02]"
                />
              </Link>

              <TopNav />

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="group inline-flex cursor-pointer items-center gap-2 rounded-full border border-slate-200 bg-white py-1.5 pl-2 pr-3 text-sm font-semibold text-slate-900 shadow-sm transition-all duration-200 hover:border-slate-300 hover:bg-slate-50 active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/35"
                  aria-label="Nico user menu"
                >
                  <span className="flex size-8 items-center justify-center rounded-full bg-slate-950 text-white transition-transform duration-200 group-hover:scale-105">
                    <UserRoundIcon className="size-4" />
                  </span>
                  <span>Nico</span>
                </button>
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
