import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Mirakl Product Enrichment",
  description: "Review Mirakl baselines, Orange source data, and evidence-backed enrichment candidates."
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
