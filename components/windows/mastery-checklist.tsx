import { getTranslations } from 'next-intl/server'
import { MasteryPanel } from '../mastery/mastery-panel'
import { Window } from '../ui/window'
import { WindowContent } from '../ui/window-content'
import { WindowTitlebar } from '../ui/window-titlebar'
import { CloseButton } from '../close-button'

export async function MasteryChecklistWindow() {
  const t = await getTranslations('masteryChecklist')

  return (
    <Window className="relative mt-0 h-[calc(100svh-5.5rem)] min-h-75 max-w-none md:mt-10 md:h-[85svh]">
      <WindowTitlebar>
        <p>{t('title')}</p>
        <CloseButton href="/" />
      </WindowTitlebar>
      <WindowContent className="min-h-0 p-2">
        <MasteryPanel />
      </WindowContent>
    </Window>
  )
}
