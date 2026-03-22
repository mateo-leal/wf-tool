import { SPEAKERS } from '@/lib/chatrooms'
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
        <span className="whitespace-pre-wrap">{line.content}</span>
      </div>
    </div>
  )
}
