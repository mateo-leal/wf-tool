import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [new URL('https://wiki.warframe.com/images/**')],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
  },
}

export default nextConfig
