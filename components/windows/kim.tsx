import Image from 'next/image'
import { KimBooleanSettings } from './kim-boolean-settings'
import { SpoilerChatroomSelector } from '../spoiler-chatroom-selector'
import { Window } from '../ui/window'
import { WindowTitlebar } from '../ui/window-titlebar'
import { WindowContent } from '../ui/window-content'

export function KimWindow() {
  return (
    <Window className="relative h-[calc(100svh-5.5rem)] min-h-75 max-w-none overflow-hidden md:absolute md:top-3 md:bottom-3 md:left-3 md:h-auto md:w-[320px] md:max-w-[calc(100%-1.5rem)] md:max-h-none">
      <WindowTitlebar>
        <p>Welcome to KIM!</p>
        <KimBooleanSettings />
      </WindowTitlebar>
      <WindowContent>
        <div className="flex gap-3 text-primary">
          <Image
            src="https://wiki.warframe.com/images/LotusSymbolGlyph.png"
            alt="Lotus Symbol"
            width={70}
            height={70}
            className="border-4 border-primary/70"
            loading="eager"
          />
          <div>
            <p className="font-title text-xl tracking-wide uppercase">
              Username:
            </p>
            <p className="font-title text-3xl leading-none">Drifter</p>
          </div>
        </div>
        <div className="mt-3 min-h-0 flex-1 overflow-hidden">
          <SpoilerChatroomSelector />
        </div>
      </WindowContent>
    </Window>
  )
}
