'use client'

import Link from 'next/link'
import { ChatCircleTextIcon, GithubLogoIcon } from '@phosphor-icons/react'
import { usePathname } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

export function Taskbar() {
  const pathname = usePathname()
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNow(new Date())
    }, 1000)

    return () => {
      window.clearInterval(interval)
    }
  }, [])

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
            href="https://github.com/mateo-leal/wf-tool"
            target="_blank"
            rel="noopener noreferrer"
            title="GitHub Repository"
            aria-label="Open GitHub repository"
            className="group relative flex size-11 items-center justify-center rounded-2xl transition hover:bg-black/10"
          >
            <GithubLogoIcon
              size={28}
              className="transition group-hover:scale-105"
            />
            <span className="absolute bottom-1 h-1 w-1.5 rounded-full bg-neutral-900/60 opacity-60 transition-all group-hover:w-3" />
          </Link>
          {/* <Link href="/test">Test</Link> */}
        </div>
      </div>

      <div className="ml-auto text-right text-xs leading-tight">
        <div className="font-medium tracking-widest">{timeLabel}</div>
        <div className="-tracking-tighter opacity-80">{dateLabel}</div>
      </div>
    </footer>
  )
}
