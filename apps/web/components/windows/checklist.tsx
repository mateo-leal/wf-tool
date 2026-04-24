import {
  MissionTypeProvider,
  RegionProvider,
} from '@tenno-companion/core/server'
import { getLocale, getTranslations } from 'next-intl/server'

import { Window } from '../ui/window'
import { CloseButton } from '../close-button'
import { WindowContent } from '../ui/window-content'
import { WindowTitlebar } from '../ui/window-titlebar'
import { ChecklistPanel } from '../checklist/checklist-panel'

export async function ChecklistWindow() {
  const locale = await getLocale()
  const t = await getTranslations('checklist')
  const missionTypes = await MissionTypeProvider.create({ locale })
  const regions = await RegionProvider.create({ locale })

  return (
    <Window className="relative mt-0 h-[calc(100svh-5.5rem)] min-h-75 max-w-none md:mt-10 md:h-[85svh]">
      <WindowTitlebar>
        <h1 className="window-title">{t('title')}</h1>
        <CloseButton href="/" />
      </WindowTitlebar>
      <WindowContent className="min-h-0 p-2">
        <ChecklistPanel
          missionTypes={missionTypes.getAll()}
          regions={regions.getAll()}
        />
      </WindowContent>
    </Window>
  )
}
