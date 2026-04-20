'use client'

import { notFound } from 'next/navigation'
import { DialogueSelectorPanel } from '@/components/kim/dialogue-selector-panel'

import { Window } from '../ui/window'
import { CloseButton } from '../close-button'
import { WindowContent } from '../ui/window-content'
import { WindowTitlebar } from '../ui/window-titlebar'
import { CHATROOMS } from '@tenno-companion/kim/constants'
import type { Chatroom } from '@tenno-companion/kim/types'
import { KIMChatProvider } from '../providers/kim-chat'

export function ChatWindow({ chatroom }: { chatroom: string }) {
  if (!(CHATROOMS as readonly string[]).includes(chatroom)) {
    notFound()
  }

  return (
    <Window className="relative z-10 mt-0 h-[calc(100svh-5.5rem)] min-h-75 max-w-none md:mt-16 md:mr-10 md:ml-auto md:h-[75svh] md:max-w-280">
      <WindowTitlebar>
        <p className="window-title capitalize">{chatroom}</p>
        <CloseButton href="/kim" />
      </WindowTitlebar>
      <WindowContent className="sm:p-3">
        <div className="mt-2 grid min-h-0 flex-1 gap-2 grid-rows-[minmax(170px,30svh)_minmax(0,1fr)] md:grid-rows-1 md:grid-cols-[minmax(0,270px)_minmax(0,1fr)]">
          <KIMChatProvider chatroom={chatroom as Chatroom}>
            <DialogueSelectorPanel />
          </KIMChatProvider>
        </div>
      </WindowContent>
    </Window>
  )
}
