import { SPEAKERS } from '@/lib/chatrooms'
import { parseEmojiContent } from '@/lib/emoji-tokens'
import { TranscriptLine } from '@/lib/types'
import Image from 'next/image'
import { useMemo } from 'react'

export function ChatLine({ line }: { line: TranscriptLine }) {
  const chatroomIcon = useMemo(() => {
    return (
      SPEAKERS.find((speaker) =>
        speaker.alias.some(
          (alias) => alias.toLowerCase() === line.user.toLowerCase()
        )
      )?.icon ?? 'https://wiki.warframe.com/images/LotusSymbolGlyph.png'
    )
  }, [line.user])

  const contentParts = useMemo(
    () => parseEmojiContent(line.content),
    [line.content]
  )

  return (
    <div className="flex items-center gap-2">
      <Image
        src={chatroomIcon}
        alt={line.user}
        width={55}
        height={55}
        className="border-2 border-primary/50"
        loading="lazy"
      />
      <div className="flex flex-col">
        <span className="text-primary text-xl capitalize">{line.user}:</span>
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
