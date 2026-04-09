'use client'

import {
  ChatCircleTextIcon,
  GearSixIcon,
  ListChecksIcon,
  MedalMilitaryIcon,
} from '@phosphor-icons/react'
import { SettingsPortal } from './windows/settings'
import { useEffect, useState } from 'react'
import { Link, usePathname } from '@/i18n/navigation'
import { cn } from '@/lib/utils'
import { useLocale, useTranslations } from 'next-intl'

function Clock() {
  const locale = useLocale()
  const [now, setNow] = useState<Date | null>(null)

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNow(new Date())
    }, 1000)
    return () => window.clearInterval(interval)
  }, [])

  // To avoid hydration mismatch
  if (!now) {
    return (
      <div className="ml-auto text-right text-xs leading-tight animate-pulse">
        <div className="h-3 w-12 bg-neutral-900/10 rounded mb-1" />
        <div className="h-3 w-16 bg-neutral-900/10 rounded" />
      </div>
    )
  }

  const timeLabel = now.toLocaleTimeString(locale, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })

  const dateLabel = now.toLocaleDateString(locale, {
    month: 'numeric',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <div className="ml-auto text-right text-xs leading-tight">
      <div className="font-medium tracking-widest tabular-nums">
        {timeLabel}
      </div>
      <div className="-tracking-tighter opacity-80 tabular-nums">
        {dateLabel}
      </div>
    </div>
  )
}

export function Taskbar() {
  const pathname = usePathname()
  const t = useTranslations()
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  useEffect(() => {
    if (!isSettingsOpen) return

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsSettingsOpen(false)
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isSettingsOpen])

  const kimIsActive = pathname.startsWith('/kim')

  return (
    <footer className="relative mt-2 flex items-center justify-between gap-3 border border-success-bg bg-taskbar-bg px-3 py-2 text-neutral-900">
      <div className="flex flex-1 justify-center sm:absolute sm:left-1/2 sm:-translate-x-1/2">
        <div className="flex items-end gap-1">
          <Link
            href="/checklist"
            aria-label={t('checklist.title')}
            className="group relative flex size-11 items-center justify-center rounded-2xl transition hover:bg-black/10"
          >
            <ListChecksIcon
              size={28}
              weight={pathname === '/checklist' ? 'fill' : 'regular'}
              className="transition group-hover:scale-105"
            />
            <span
              className={cn(
                'absolute bottom-1 h-1 rounded-full bg-neutral-900 transition-all',
                pathname === '/checklist'
                  ? 'w-5'
                  : 'w-1.5 opacity-60 group-hover:w-3'
              )}
            />
          </Link>

          <Link
            href="/kim"
            aria-label={t('kim.title')}
            className="group relative flex size-11 items-center justify-center rounded-2xl transition hover:bg-black/10"
          >
            <ChatCircleTextIcon
              size={28}
              weight={kimIsActive ? 'fill' : 'regular'}
              className="transition group-hover:scale-105"
            />
            <span
              className={cn(
                'absolute bottom-1 h-1 rounded-full bg-neutral-900 transition-all',
                kimIsActive ? 'w-5' : 'w-1.5 opacity-60 group-hover:w-3'
              )}
            />
          </Link>

          <Link
            href="/mastery"
            aria-label={t('masteryChecklist.title')}
            className="group relative flex size-11 items-center justify-center rounded-2xl transition hover:bg-black/10"
          >
            <MedalMilitaryIcon
              size={28}
              weight={pathname === '/mastery' ? 'fill' : 'regular'}
              className="transition group-hover:scale-105"
            />
            <span
              className={cn(
                'absolute bottom-1 h-1 rounded-full bg-neutral-900 transition-all',
                pathname === '/mastery'
                  ? 'w-5'
                  : 'w-1.5 opacity-60 group-hover:w-3'
              )}
            />
          </Link>

          <button
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            aria-label={t('settings.title')}
            className="group relative flex size-11 items-center justify-center rounded-2xl transition hover:bg-black/10"
          >
            <GearSixIcon
              size={28}
              weight={isSettingsOpen ? 'fill' : 'regular'}
              className="transition group-hover:scale-105"
            />
            <span
              className={cn(
                'absolute bottom-1 h-1 rounded-full bg-neutral-900 transition-all',
                isSettingsOpen ? 'w-5' : 'w-1.5 opacity-60 group-hover:w-3'
              )}
            />
          </button>
        </div>
      </div>

      <Clock />

      <SettingsPortal
        isOpen={isSettingsOpen}
        onCloseAction={() => setIsSettingsOpen(false)}
      />
    </footer>
  )
}
