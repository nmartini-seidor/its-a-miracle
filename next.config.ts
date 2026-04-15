import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "eshopfrontend.orange.es" },
      { protocol: "https", hostname: "www.orange.es" }
    ]
  }
}

export default nextConfig
