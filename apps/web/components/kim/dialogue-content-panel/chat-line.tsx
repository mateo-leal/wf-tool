'use client'

import Image from 'next/image'
import { useMemo } from 'react'
import type { DialogueContentNode } from '@tenno-companion/kim/types'

import { DEFAULT_ICON, SPEAKERS } from '@/lib/kim/chatrooms'
import { parseEmojiContent } from '@/lib/kim/emoji-tokens'

import { useKIMChat } from '../../providers/kim-chat'
import { NodeType } from '@tenno-companion/kim/constants'
import { toTitleCase } from '@/lib/utils'

export function ChatLine({ node }: { node: DialogueContentNode }) {
  const { chatroom } = useKIMChat()

  const getUser = () => {
    if (node.type === NodeType.Dialogue) {
      return node.Speaker ?? toTitleCase(chatroom)
    }
    return 'Player'
  }

  const chatroomIcon = useMemo(() => {
    console.log(chatroom)
    if (node.type === NodeType.Dialogue) {
      return (
        SPEAKERS.find((speaker) =>
          speaker.alias.some((alias) => alias === (node.Speaker ?? chatroom))
        )?.icon ?? DEFAULT_ICON
      )
    }
    return DEFAULT_ICON
  }, [chatroom, node])

  const contentParts = useMemo(
    () => parseEmojiContent(node.LocTag),
    [node.LocTag]
  )

  return (
    <div className="flex items-center gap-2">
      <Image
        src={chatroomIcon}
        alt={chatroom}
        width={55}
        height={55}
        className="border-2 border-primary/50"
        loading="lazy"
      />
      <div className="flex flex-col">
        <span className="text-primary text-xl">{getUser()}:</span>
        <span className="whitespace-pre-wrap">
          {contentParts.map((part, index) => {
            if (part.kind === 'text') {
              return <span key={`text-${index}`}>{part.value}</span>
            }

            return (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={`emoji-${part.token}-${index}`}
                src={part.src}
                alt={part.alt}
                className="mx-0.5 inline-block h-6 w-auto align-text-bottom"
                loading="lazy"
              />
            )
          })}
        </span>
      </div>
    </div>
  )
}
