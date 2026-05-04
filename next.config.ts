import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "www.mediamarkt.es" },
      { protocol: "https", hostname: "assets.mmsrg.com" }
    ]
  }
}

export default nextConfig
