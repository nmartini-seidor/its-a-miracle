import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // better-sqlite3 is a native addon (ADR 0003) — keep it external so the bundler does not
  // try to pack the .node binding into the server build.
  serverExternalPackages: ["better-sqlite3"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "www.mediamarkt.es" },
      { protocol: "https", hostname: "assets.mmsrg.com" }
    ]
  }
}

export default nextConfig
