import { getLocale, getTranslations } from 'next-intl/server'
import { Window } from '../ui/window'
import { WindowContent } from '../ui/window-content'
import { WindowTitlebar } from '../ui/window-titlebar'
import { CloseButton } from '../close-button'
import { MasteryPanel } from '../mastery/mastery-panel'
import { buildMasteryData } from '@/lib/mastery'

export async function MasteryChecklistWindow() {
  const locale = await getLocale()
  const t = await getTranslations('masteryChecklist')

  const masteryData = await buildMasteryData(locale)

  return (
    <Window className="relative mt-0 h-[calc(100svh-5.5rem)] min-h-75 max-w-none md:mt-10 md:h-[85svh]">
      <WindowTitlebar>
        <h1>{t('title')}</h1>
        <CloseButton href="/" />
      </WindowTitlebar>
      <WindowContent className="min-h-0 p-2">
        <MasteryPanel masteryData={masteryData} />
      </WindowContent>
    </Window>
  )
}
