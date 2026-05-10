import { NextResponse } from "next/server"

function normalizeMiraklBaseUrl(value: unknown) {
  if (typeof value !== "string") return null
  try {
    const url = new URL(value.trim())
    if (url.protocol !== "https:" && url.protocol !== "http:") return null
    url.pathname = url.pathname.replace(/\/+$/, "")
    url.search = ""
    url.hash = ""
    return url.toString().replace(/\/$/, "")
  } catch {
    return null
  }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Expected MIRAKL connection details." }, { status: 400 })
  }

  const miraklBaseUrl = normalizeMiraklBaseUrl((body as Record<string, unknown>).miraklBaseUrl)
  const operatorKey = (body as Record<string, unknown>).operatorKey

  if (!miraklBaseUrl) return NextResponse.json({ error: "Enter a valid MIRAKL URL." }, { status: 400 })
  if (typeof operatorKey !== "string" || operatorKey.trim().length === 0) {
    return NextResponse.json({ error: "Enter a MIRAKL operator key." }, { status: 400 })
  }

  const checkUrl = new URL("/api/shops", miraklBaseUrl)
  checkUrl.searchParams.set("max", "1")

  try {
    const response = await fetch(checkUrl, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${operatorKey.trim()}`,
      },
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: `MIRAKL connectivity failed with HTTP ${response.status}.` },
        { status: 424 },
      )
    }
  } catch {
    return NextResponse.json({ error: "MIRAKL connectivity check could not reach the endpoint." }, { status: 424 })
  }

  return NextResponse.json({
    connected: true,
    miraklBaseUrl,
    message: "MIRAKL connectivity confirmed.",
  })
}
