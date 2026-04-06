'use client'

import { useSyncExternalStore } from 'react'
import { ChatroomSelector } from './chatroom-selector'
import { Switch } from '../ui/switch'
import { SHOW_SPOILERS_STORAGE_KEY } from '@/lib/constants'
import { useTranslations } from 'next-intl'

const SHOW_SPOILERS_CHANGE_EVENT = 'wf-kim:show-spoilers-change'

function subscribe(onStoreChange: () => void): () => void {
  if (typeof window === 'undefined') {
    return () => {}
  }

  const handleChange = () => onStoreChange()

  window.addEventListener('storage', handleChange)
  window.addEventListener(SHOW_SPOILERS_CHANGE_EVENT, handleChange)

  return () => {
    window.removeEventListener('storage', handleChange)
    window.removeEventListener(SHOW_SPOILERS_CHANGE_EVENT, handleChange)
  }
}

function getClientSnapshot(): boolean {
  try {
    return localStorage.getItem(SHOW_SPOILERS_STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

function getServerSnapshot(): boolean {
  return false
}

export function SpoilerChatroomSelector() {
  const t = useTranslations('kim')
  const showSpoilers = useSyncExternalStore(
    subscribe,
    getClientSnapshot,
    getServerSnapshot
  )

  const setShowSpoilers = (checked: boolean) => {
    try {
      localStorage.setItem(SHOW_SPOILERS_STORAGE_KEY, checked ? '1' : '0')
      window.dispatchEvent(new Event(SHOW_SPOILERS_CHANGE_EVENT))
    } catch {
      // Ignore localStorage failures in restricted environments.
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-end gap-2 px-2 py-1 text-sm text-foreground">
        <span>{t('showSpoilers')}</span>
        <Switch checked={showSpoilers} onCheckedChange={setShowSpoilers} />
      </div>
      <div className="min-h-0 flex-1 -mt-9">
        <ChatroomSelector showSpoilers={showSpoilers} />
      </div>
    </div>
  )
}
