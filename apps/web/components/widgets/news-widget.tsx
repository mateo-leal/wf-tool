'use client'

import { useEffect, useState, useMemo } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { useGameData } from '../providers/game-data'

type EventItem = {
  id: string
  type: 'community' | 'official'
  message: string
  time: number
  link?: string
}

function parseLink(link?: string) {
  if (!link) return undefined
  try {
    const url = new URL(link)
    url.searchParams.set('utm_source', 'tennocompanion')
    url.searchParams.set('utm_medium', 'news-widget')
    return url.href
  } catch {
    return undefined
  }
}

function NewsItem({ item }: { item: EventItem }) {
  const locale = useLocale()
  const t = useTranslations('newsWidget')

  const formattedDate = useMemo(() => {
    return new Intl.DateTimeFormat(locale, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(item.time * 1000))
  }, [locale, item.time])

  const content = (
    <>
      <p className="text-sm leading-snug text-foreground">{item.message}</p>
      <div className="mt-2 flex items-center justify-between gap-2 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
        <span>{t(item.type)}</span>
        <span className="tabular-nums">{formattedDate}</span>
      </div>
    </>
  )

  const containerClasses =
    'block border border-muted-primary/40 bg-background/35 p-2 transition'

  if (item.link) {
    return (
      <Link
        href={item.link}
        target="_blank"
        rel="noopener noreferrer"
        prefetch={false}
        className={cn(
          containerClasses,
          'hover:border-primary/60 hover:bg-background/50'
        )}
      >
        {content}
      </Link>
    )
  }

  return <div className={containerClasses}>{content}</div>
}

export function NewsWidget() {
  const locale = useLocale()
  const t = useTranslations('newsWidget')
  const { worldState, isLoading: isGlobalLoading } = useGameData()

  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true)
  }, [])

  const eventItems = useMemo(() => {
    if (!worldState?.Events) return []

    return worldState.Events.filter((event) => event.Date)
      .map((event): EventItem | undefined => {
        const time = Math.trunc(Number(event.Date!.$date.$numberLong) / 1000)

        // Find localized message
        const message = event.Messages.find(
          (m) => m.LanguageCode === locale
        )?.Message

        // Find localized link
        const eventLink = event.Links?.find(
          (l) => l.LanguageCode === locale
        )?.Link

        const link = parseLink(event.Prop.length > 0 ? event.Prop : eventLink)

        // Filter out system messages/discord invites
        if (
          message &&
          message !== '/Lotus/Language/CommunityMessages/JoinDiscord'
        ) {
          return {
            id: event._id.$oid,
            type: event.Community ? 'community' : 'official',
            message,
            time,
            link,
          }
        }
        return undefined
      })
      .filter((item): item is EventItem => !!item)
      .sort((a, b) => b.time - a.time)
  }, [worldState, locale])

  const showLoading = !mounted || (isGlobalLoading && !worldState)

  return (
    <div className="border border-muted-primary/60 bg-background/75 p-3 pb-0 pr-0">
      <div className="mr-3 border-b border-muted-primary/40 pb-2">
        <p className="font-title text-xl leading-none text-primary">
          {t('title')}
        </p>
      </div>

      <div className="max-h-96 overflow-y-auto pb-3 pr-1 pt-3">
        {showLoading ? (
          // Skeleton
          <div className="grid gap-2 mr-2">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-16 w-full animate-pulse border border-muted-primary/20 bg-background/20"
              />
            ))}
          </div>
        ) : eventItems.length > 0 ? (
          <div className="grid gap-2">
            {eventItems.map((item) => (
              <NewsItem key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <div className="m-3 ml-0 border border-muted-primary/40 bg-background/35 px-3 py-2 text-sm text-muted-foreground">
            {t('empty')}
          </div>
        )}
      </div>
    </div>
  )
}
