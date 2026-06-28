import { NextResponse } from "next/server"
import { isDevMiraklHost, probeMiraklAuth, resolveMiraklHost } from "@/server/mirakl-request"

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
  const allowNonDevHost = (body as Record<string, unknown>).allowNonDevHost === true

  if (!miraklBaseUrl) return NextResponse.json({ error: "Enter a valid MIRAKL URL." }, { status: 400 })
  if (typeof operatorKey !== "string" || operatorKey.trim().length === 0) {
    return NextResponse.json({ error: "Enter a MIRAKL operator key." }, { status: 400 })
  }

  // Dev-by-default host guard (ADR 0007 item 9). This route used to accept an arbitrary host from
  // the body with zero checks; now a non-dev host needs an explicit, logged `allowNonDevHost` flag.
  const host = resolveMiraklHost(miraklBaseUrl)
  if (!isDevMiraklHost(miraklBaseUrl) && !allowNonDevHost) {
    console.warn(`[mirakl-connectivity] refused non-dev host "${host}" without allowNonDevHost`)
    return NextResponse.json(
      { error: `Refusing to probe non-dev Mirakl host "${host}" without explicit approval. Use the dev tenant or pass allowNonDevHost.`, code: "NON_DEV_HOST" },
      { status: 403 },
    )
  }
  console.info(`[mirakl-connectivity] probing host "${host}" (allowNonDevHost=${allowNonDevHost})`)

  const checkUrl = new URL("/api/shops", miraklBaseUrl)
  checkUrl.searchParams.set("max", "1")

  // Try the configured auth scheme first, then the other (raw ⇆ bearer), and report the winner.
  const probe = await probeMiraklAuth(checkUrl, operatorKey.trim())
  if (!probe.ok) {
    return NextResponse.json(
      { error: probe.status ? `MIRAKL connectivity failed with HTTP ${probe.status}.` : "MIRAKL connectivity check could not reach the endpoint." },
      { status: 424 },
    )
  }

  return NextResponse.json({
    connected: true,
    miraklBaseUrl,
    authScheme: probe.scheme,
    message: `MIRAKL connectivity confirmed (auth scheme: ${probe.scheme}).`,
  })
}
