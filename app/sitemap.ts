import type { MetadataRoute } from 'next'
import { CHATROOM_SOURCE_BY_ID } from '@/lib/kim/chatrooms'
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

  const chatroomRoutes: MetadataRoute.Sitemap = Object.keys(
    CHATROOM_SOURCE_BY_ID
  ).map((chatroomId) => ({
    url: `${siteUrl}/kim/${chatroomId}`,
    changeFrequency: 'daily',
    priority: 0.8,
    alternates: {
      languages: localePrefixes.reduce(
        (acc, locale) => {
          if (locale === 'tc') {
            acc['zh-TW'] = `${siteUrl}/${locale}/kim/${chatroomId}`
            return acc
          }
          acc[locale] = `${siteUrl}/${locale}/kim/${chatroomId}`
          return acc
        },
        {} as Record<string, string>
      ),
    },
  }))

  return [...staticRoutes, ...chatroomRoutes]
}
