'use client'

import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'

import { cn } from '@/lib/utils'
import { usePathname } from '@/i18n/navigation'
import { DEFAULT_ICON } from '@/lib/kim/chatrooms'

import {
  loadShowSpoilersFromStorage,
  saveShowSpoilersToStorage,
} from '../providers/kim-chat'
import { Switch } from '../ui/switch'
import { Window } from '../ui/window'
import { CloseButton } from '../close-button'
import { WindowContent } from '../ui/window-content'
import { WindowTitlebar } from '../ui/window-titlebar'
import { ChatroomSelector } from '../kim/chatroom-selector'
import { KimBooleanSettings } from './kim-boolean-settings'

export function KimWindow() {
  const pathname = usePathname()
  const t = useTranslations('kim')
  const isKimHome = pathname === '/kim'
  const [showSpoilers, setShowSpoilers] = useState(false)

  useEffect(() => {
    const setUserShowSpoilers = () => {
      const userShowSpoilers = loadShowSpoilersFromStorage()
      setShowSpoilers(userShowSpoilers)
    }
    setUserShowSpoilers()
  }, [setShowSpoilers])

  const updateShowSpoilers = (checked: boolean) => {
    saveShowSpoilersToStorage(checked)
    setShowSpoilers(checked)
  }

  return (
    <Window
      className={cn(
        'relative h-[calc(100svh-5.5rem)] min-h-75 max-w-none overflow-hidden md:absolute md:top-3 md:bottom-3 md:left-3 md:h-auto md:w-[320px] md:max-w-[calc(100%-1.5rem)] md:max-h-none',
        { 'hidden md:block': !isKimHome }
      )}
    >
      <WindowTitlebar>
        <h1>{t('windowTitle')}</h1>
        <div className="flex gap-1">
          <KimBooleanSettings />
          <CloseButton href="/" disabled={!isKimHome} />
        </div>
      </WindowTitlebar>
      <WindowContent>
        <div className="flex gap-3 text-primary">
          <Image
            src={DEFAULT_ICON}
            alt="Lotus Symbol"
            width={70}
            height={70}
            className="border-4 border-primary/70"
            loading="eager"
          />
          <div>
            <p className="font-title text-xl tracking-wide uppercase">
              {t('username')}
            </p>
            <p className="font-title text-3xl leading-none">{t('drifter')}</p>
          </div>
        </div>
        <div className="mt-3 min-h-0 flex-1 overflow-hidden">
          <div className="flex h-full min-h-0 flex-col">
            <div className="flex items-center justify-end gap-2 px-2 py-1 text-sm text-foreground">
              <span>{t('showSpoilers')}</span>
              <Switch
                checked={showSpoilers}
                onCheckedChange={updateShowSpoilers}
              />
            </div>
            <div className="min-h-0 flex-1 -mt-9">
              <ChatroomSelector showSpoilers={showSpoilers} />
            </div>
          </div>
        </div>
      </WindowContent>
    </Window>
  )
}
