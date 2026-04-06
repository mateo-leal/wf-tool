'use client'

import Image from 'next/image'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { cn } from '@/lib/utils'
import { usePathname } from 'next/navigation'
import { CATHEDRALE_CHATROOMS, HEX_CHATROOMS } from '@/lib/kim/chatrooms'
import { Link } from '@/i18n/navigation'

type ChatroomSelectorProps = {
  showSpoilers?: boolean
}

const SPOILER_CHATROOM_IDS = new Set(['flare', 'kaya', 'minerva-velimir'])

export function ChatroomSelector({
  showSpoilers = false,
}: ChatroomSelectorProps) {
  const pathname = usePathname()
  const hexChatrooms = showSpoilers
    ? HEX_CHATROOMS
    : HEX_CHATROOMS.filter((room) => !SPOILER_CHATROOM_IDS.has(room.id))

  const selectedTab = CATHEDRALE_CHATROOMS.some(
    (room) => pathname === `/kim/${room.id}`
  )
    ? 'cathedrale'
    : 'hex'

  return (
    <Tabs
      defaultValue={selectedTab}
      className="h-full min-h-0 flex-col gap-0 pt-4"
    >
      <TabsList className="shrink-0 gap-1 p-0">
        <TabsTrigger
          value="hex"
          className="p-0 border-4 border-primary/50 data-active:border-primary"
        >
          <Image
            src="https://wiki.warframe.com/images/HexIcon.png"
            alt="The Hex"
            width={60}
            height={60}
            className="bg-hex"
          />
        </TabsTrigger>
        <TabsTrigger
          value="cathedrale"
          className="p-0 border-4 border-primary/50 data-active:border-primary"
        >
          <Image
            src="https://wiki.warframe.com/images/ScaldraIcon.png"
            alt="La Cathédrale"
            width={60}
            height={60}
            className="bg-cathedrale"
          />
        </TabsTrigger>
      </TabsList>
      <TabsContent
        value="hex"
        className="border-t-4 border-primary/50 -mt-1 flex min-h-0 flex-1 flex-col overflow-hidden"
      >
        <ul className="-mt-1 min-h-0 flex-1 overflow-y-auto border-4 border-primary/50 py-1">
          {hexChatrooms.map((chatroom) => (
            <li key={chatroom.id} className="mx-1">
              <Link
                href={`/kim/${chatroom.id}`}
                className={cn(
                  'inline-flex w-full gap-2 bg-accent/40 hover:bg-accent',
                  {
                    'bg-accent': pathname === `/kim/${chatroom.id}`,
                  }
                )}
              >
                <Image
                  src={chatroom.icon}
                  alt={`${chatroom.name} icon`}
                  width={65}
                  height={65}
                  className={cn('border-2 border-primary/50', {
                    'bg-hex': chatroom.id === 'hex',
                  })}
                />
                <span className="text-xl">{chatroom.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </TabsContent>
      <TabsContent
        value="cathedrale"
        className="border-t-4 border-primary/50 -mt-1 flex min-h-0 flex-1 flex-col overflow-hidden"
      >
        <ul className="-mt-1 min-h-0 flex-1 overflow-y-auto border-4 border-primary/50 py-1">
          {CATHEDRALE_CHATROOMS.map((chatroom) => (
            <li key={chatroom.id} className="mx-1">
              <Link
                href={`/kim/${chatroom.id}`}
                className={cn(
                  'inline-flex w-full gap-2 bg-accent/40 hover:bg-accent',
                  {
                    'bg-accent': pathname === `/kim/${chatroom.id}`,
                  }
                )}
              >
                <Image
                  src={chatroom.icon}
                  alt={chatroom.name}
                  width={65}
                  height={65}
                  className="border-2 border-primary/50"
                />
                <span className="text-xl">{chatroom.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </TabsContent>
    </Tabs>
  )
}
