import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [new URL('https://wiki.warframe.com/images/**')],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
  },
}

const withNextIntl = createNextIntlPlugin()
export default withNextIntl(nextConfig)
