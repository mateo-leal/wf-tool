import { getTranslations } from 'next-intl/server'
import { ChecklistPanel } from '../checklist/checklist-panel'
import { Window } from '../ui/window'
import { WindowContent } from '../ui/window-content'
import { WindowTitlebar } from '../ui/window-titlebar'
import { CloseButton } from '../close-button'

export async function ChecklistWindow() {
  const t = await getTranslations('checklist')

  return (
    <Window className="relative mt-0 h-[calc(100svh-5.5rem)] min-h-75 max-w-none md:mt-10 md:h-[85svh]">
      <WindowTitlebar>
        <p className="window-title">{t('title')}</p>
        <CloseButton href="/" />
      </WindowTitlebar>
      <WindowContent className="min-h-0 p-2">
        <ChecklistPanel />
      </WindowContent>
    </Window>
  )
}
