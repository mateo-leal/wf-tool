import type { MetadataRoute } from 'next'
import { CHATROOMS } from '@tenno-companion/kim/constants'

import { getSiteUrl } from '@/lib/seo'
import { routing } from '@/i18n/routing'

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl()
  const localePrefixes = routing.locales.filter((locale) => locale !== 'en')

  const staticPages = [
    { url: '/', priority: 1 },
    { url: '/kim', priority: 0.9 },
    { url: '/checklist', priority: 0.9 },
    { url: '/mastery', priority: 0.9 },
  ]

  const staticRoutes: MetadataRoute.Sitemap = staticPages.map((path) => ({
    url: `${siteUrl}${path.url}`,
    lastModified: new Date(),
    priority: path.priority,
    alternates: {
      languages: localePrefixes.reduce(
        (acc, locale) => {
          if (locale === 'tc') {
            acc['zh-TW'] = `${siteUrl}/${locale}${path.url}`
            return acc
          }
          acc[locale] = `${siteUrl}/${locale}${path.url}`
          return acc
        },
        {} as Record<string, string>
      ),
    },
  }))

  const chatroomRoutes: MetadataRoute.Sitemap = CHATROOMS.filter(
    (chatroom) => chatroom !== 'minerva' && chatroom !== 'velimir'
  ).map((chatroom) => ({
    url: `${siteUrl}/kim/${chatroom}`,
    changeFrequency: 'daily',
    priority: 0.8,
    alternates: {
      languages: localePrefixes.reduce(
        (acc, locale) => {
          if (locale === 'tc') {
            acc['zh-TW'] = `${siteUrl}/${locale}/kim/${chatroom}`
            return acc
          }
          acc[locale] = `${siteUrl}/${locale}/kim/${chatroom}`
          return acc
        },
        {} as Record<string, string>
      ),
    },
  }))

  return [...staticRoutes, ...chatroomRoutes]
}
