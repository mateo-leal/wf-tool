'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Switch } from '../ui/switch'
import { ChatroomSelector } from './chatroom-selector'
import {
  loadShowSpoilersFromStorage,
  saveShowSpoilersToStorage,
} from '../providers/kim-chat'

export function SpoilerChatroomSelector() {
  const t = useTranslations('kim')
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
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-end gap-2 px-2 py-1 text-sm text-foreground">
        <span>{t('showSpoilers')}</span>
        <Switch checked={showSpoilers} onCheckedChange={updateShowSpoilers} />
      </div>
      <div className="min-h-0 flex-1 -mt-9">
        <ChatroomSelector showSpoilers={showSpoilers} />
      </div>
    </div>
  )
}
