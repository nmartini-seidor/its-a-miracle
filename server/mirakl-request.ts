// Shared Mirakl auth + host helper (ADR 0007). ONE place builds the Authorization header and judges
// dev-vs-prod hosts, so the TypeScript call sites (write-back submit + poll, connectivity probe)
// can't drift on the scheme or the guard. The standalone `scripts/sync-mirakl-snapshot.mjs` CLI
// keeps a documented mirror of `miraklAuthHeader` only because it runs under plain `node` (no
// type-stripping) and so cannot import this .ts module at runtime.

// Mirakl static-key tenants want the RAW api key in the Authorization header; Mirakl Connect wants
// `Bearer <token>`. The repo authenticates with a static operator key, so the default is `raw`.
export type MiraklAuthScheme = "raw" | "bearer"

export function getMiraklAuthScheme(): MiraklAuthScheme {
  return process.env.MIRAKL_AUTH_SCHEME === "bearer" ? "bearer" : "raw"
}

export function miraklAuthHeader(token: string, scheme: MiraklAuthScheme = getMiraklAuthScheme()): string {
  return scheme === "bearer" ? `Bearer ${token}` : token
}

export function miraklHeaders(token: string, scheme?: MiraklAuthScheme): Record<string, string> {
  // Deliberately no Content-Type: multipart submits rely on fetch setting the boundary itself.
  return { Accept: "application/json", Authorization: miraklAuthHeader(token, scheme) }
}

export function miraklRequest(
  url: string | URL,
  token: string,
  init: RequestInit & { scheme?: MiraklAuthScheme } = {},
): Promise<Response> {
  const { scheme, headers, ...rest } = init
  return fetch(url, { ...rest, headers: { ...miraklHeaders(token, scheme), ...headers } })
}

// --- Host guard --------------------------------------------------------------------------------
export function resolveMiraklHost(baseUrl: string): string {
  try {
    return new URL(baseUrl).hostname.toLowerCase()
  } catch {
    return baseUrl
  }
}

// A host is the dev tenant when it ends in `-dev.mirakl.net` (or is localhost). Writes hard-require
// this with NO override (ADR 0005); the connectivity READ uses it as a dev-by-default gate that an
// explicit `allowNonDevHost` flag can lift (ADR 0007 item 9).
export function isDevMiraklHost(baseUrl: string): boolean {
  const host = resolveMiraklHost(baseUrl)
  return /-dev\.mirakl\.net$/.test(host) || host === "localhost" || host === "127.0.0.1"
}

// Read-only auth probe used by the connectivity route: try the configured scheme first, then the
// other, and report which one Mirakl accepted (ADR 0007). Returns the winning scheme on success.
export async function probeMiraklAuth(
  url: string | URL,
  token: string,
  options: { timeoutMs?: number } = {},
): Promise<{ ok: true; scheme: MiraklAuthScheme; status: number } | { ok: false; status?: number; error?: string }> {
  const preferred = getMiraklAuthScheme()
  const schemes: MiraklAuthScheme[] = preferred === "bearer" ? ["bearer", "raw"] : ["raw", "bearer"]
  let lastStatus: number | undefined
  let lastError: string | undefined
  for (const scheme of schemes) {
    try {
      const response = await miraklRequest(url, token, {
        scheme,
        cache: "no-store",
        signal: AbortSignal.timeout(options.timeoutMs ?? 8000),
      })
      if (response.ok) return { ok: true, scheme, status: response.status }
      lastStatus = response.status
      // A non-401/403 status is not an auth-scheme problem; stop trying alternate schemes.
      if (response.status !== 401 && response.status !== 403) break
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error)
    }
  }
  return { ok: false, status: lastStatus, error: lastError }
}
