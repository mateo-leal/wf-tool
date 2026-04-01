'use client'

import {
  ChatCircleTextIcon,
  GearSixIcon,
  ListChecksIcon,
  MedalMilitaryIcon,
} from '@phosphor-icons/react'
import { SettingsPortal } from './windows/settings'
import { useEffect, useMemo, useState } from 'react'
import { Link, usePathname } from '@/i18n/navigation'

export function Taskbar() {
  const pathname = usePathname()
  const [now, setNow] = useState(() => new Date())
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNow(new Date())
    }, 1000)

    return () => {
      window.clearInterval(interval)
    }
  }, [])

  useEffect(() => {
    if (!isSettingsOpen) {
      return
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsSettingsOpen(false)
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => {
      window.removeEventListener('keydown', handleEscape)
    }
  }, [isSettingsOpen])

  const timeLabel = useMemo(
    () =>
      now.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      }),
    [now]
  )

  const dateLabel = useMemo(
    () =>
      now.toLocaleDateString('en-US', {
        month: 'numeric',
        day: 'numeric',
        year: 'numeric',
      }),
    [now]
  )

  const kimIsActive = pathname.startsWith('/kim')

  return (
    <footer className="relative mt-2 flex items-center justify-between gap-3 border border-success-bg bg-taskbar-bg px-3 py-2 text-neutral-900">
      <div className="flex flex-1 justify-center sm:absolute sm:left-1/2 sm:-translate-x-1/2">
        <div className="flex items-end gap-1">
          <Link
            href="/checklist"
            aria-label="Open Checklist"
            title="Checklist"
            className="group relative flex size-11 items-center justify-center rounded-2xl transition hover:bg-black/10"
          >
            <ListChecksIcon
              size={28}
              weight={pathname === '/checklist' ? 'fill' : 'regular'}
              className="transition group-hover:scale-105"
            />
            <span
              className={[
                'absolute bottom-1 h-1 rounded-full bg-neutral-900 transition-all',
                pathname === '/checklist'
                  ? 'w-5'
                  : 'w-1.5 opacity-60 group-hover:w-3',
              ].join(' ')}
            />
          </Link>

          <Link
            href="/kim"
            aria-label="Open KIM"
            title="KIM"
            className="group relative flex size-11 items-center justify-center rounded-2xl transition hover:bg-black/10"
          >
            <ChatCircleTextIcon
              size={28}
              weight={kimIsActive ? 'fill' : 'regular'}
              className="transition group-hover:scale-105"
            />
            <span
              className={[
                'absolute bottom-1 h-1 rounded-full bg-neutral-900 transition-all',
                kimIsActive ? 'w-5' : 'w-1.5 opacity-60 group-hover:w-3',
              ].join(' ')}
            />
          </Link>
          <Link
            href="/mastery"
            aria-label="Open Mastery Checklist"
            title="Mastery Checklist"
            className="group relative flex size-11 items-center justify-center rounded-2xl transition hover:bg-black/10"
          >
            <MedalMilitaryIcon
              size={28}
              weight={pathname === '/mastery' ? 'fill' : 'regular'}
              className="transition group-hover:scale-105"
            />
            <span
              className={[
                'absolute bottom-1 h-1 rounded-full bg-neutral-900 transition-all',
                pathname === '/mastery'
                  ? 'w-5'
                  : 'w-1.5 opacity-60 group-hover:w-3',
              ].join(' ')}
            />
          </Link>

          <button
            type="button"
            aria-label="Open settings"
            title="Settings"
            onClick={() => setIsSettingsOpen(true)}
            className="group relative flex size-11 items-center justify-center rounded-2xl transition hover:bg-black/10"
          >
            <GearSixIcon
              size={28}
              weight={isSettingsOpen ? 'fill' : 'regular'}
              className="transition group-hover:scale-105"
            />
            <span
              className={[
                'absolute bottom-1 h-1 rounded-full bg-neutral-900 transition-all',
                isSettingsOpen ? 'w-5' : 'w-1.5 opacity-60 group-hover:w-3',
              ].join(' ')}
            />
          </button>
          {/* <Link href="/test">Test</Link> */}
        </div>
      </div>

      <div className="ml-auto text-right text-xs leading-tight">
        <div className="font-medium tracking-widest">{timeLabel}</div>
        <div className="-tracking-tighter opacity-80">{dateLabel}</div>
      </div>

      <SettingsPortal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </footer>
  )
}
