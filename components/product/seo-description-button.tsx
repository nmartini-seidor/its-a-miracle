"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { SparklesIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

export function SeoDescriptionButton({ productId }: { productId: string }) {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function generateDescription() {
    setPending(true)
    setError(null)

    const response = await fetch(`/api/products/${productId}/seo-description`, { method: "POST" })
    const body = await response.json().catch(() => null)

    if (!response.ok) {
      setError(body?.error ?? "Description generation failed")
      setPending(false)
      return
    }

    setPending(false)
    router.refresh()
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button type="button" size="sm" variant="outline" onClick={generateDescription} disabled={pending} className="h-7 rounded-md px-2 text-xs">
        <SparklesIcon data-icon="inline-start" />
        {pending ? "Generating…" : "Generate SEO"}
      </Button>
      {error && <span className="text-xs font-medium text-rose-700">{error}</span>}
    </div>
  )
}
