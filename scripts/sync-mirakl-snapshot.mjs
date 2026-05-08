import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"

const MIRAKL_BASE_URL = process.env.MIRAKL_BASE_URL || "https://seidor-dev.mirakl.net"
const OUTPUT_DIR = path.join(process.cwd(), "data", "mirakl", "snapshots")
const STATUSES = ["LIVE", "NOT_LIVE"]

function requireLiveReadApproval() {
  if (!process.argv.includes("--live-read-approved")) {
    throw new Error("Refusing to call Mirakl without --live-read-approved.")
  }
}

function requireToken() {
  const token = process.env.MIRAKL_OPERATOR_API_KEY
  if (!token) {
    throw new Error("MIRAKL_OPERATOR_API_KEY must be provided in the server environment.")
  }
  return token
}

function authHeaders(token) {
  return {
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
  }
}

async function fetchJson(url, token) {
  const response = await fetch(url, { headers: authHeaders(token) })
  if (!response.ok) {
    throw new Error(`Mirakl request failed: ${response.status} ${response.statusText} ${url.pathname}`)
  }
  return response.json()
}

async function fetchText(url, token) {
  const response = await fetch(url, { headers: authHeaders(token) })
  if (!response.ok) {
    throw new Error(`Mirakl request failed: ${response.status} ${response.statusText} ${url.pathname}`)
  }
  return response.text()
}

function snapshotPath(prefix, extension) {
  const stamp = new Date().toISOString().replaceAll(":", "-").replaceAll(".", "-")
  return path.join(OUTPUT_DIR, `${prefix}-${stamp}.${extension}`)
}

async function fetchShops(token) {
  const url = new URL("/api/shops", MIRAKL_BASE_URL)
  url.searchParams.set("max", "100")
  url.searchParams.set("offset", "0")
  return fetchJson(url, token)
}

function getShopRows(payload) {
  if (Array.isArray(payload?.shops)) return payload.shops
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload)) return payload
  return []
}

async function fetchSourceStatusCsv(token, providerId, status) {
  const url = new URL("/api/mcm/products/sources/status/export", MIRAKL_BASE_URL)
  url.searchParams.set("provider_id", String(providerId))
  url.searchParams.set("status", status)
  return fetchText(url, token)
}

async function main() {
  requireLiveReadApproval()
  const token = requireToken()
  await mkdir(OUTPUT_DIR, { recursive: true })

  const shops = await fetchShops(token)
  const shopRows = getShopRows(shops)
  const sourceStatusExports = []

  for (const shop of shopRows) {
    const providerId = shop.shop_id ?? shop.id
    if (providerId == null) continue

    for (const status of STATUSES) {
      const csv = await fetchSourceStatusCsv(token, providerId, status)
      sourceStatusExports.push({
        providerId,
        shopName: shop.shop_name ?? shop.name ?? null,
        status,
        csv,
      })
    }
  }

  const snapshot = {
    capturedAt: new Date().toISOString(),
    miraklBaseUrl: MIRAKL_BASE_URL,
    shops,
    sourceStatusExports,
  }

  const outputPath = snapshotPath("mirakl-source-status", "json")
  await writeFile(outputPath, JSON.stringify(snapshot, null, 2))
  console.log(outputPath)
}

main().catch((error) => {
  console.error(error.message)
  process.exitCode = 1
})
