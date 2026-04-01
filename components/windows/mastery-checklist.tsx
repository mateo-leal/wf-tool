import { buildMasteryData, type MasteryData } from '@/lib/mastery'
import {
  fetchPublicExportDictionary,
  fetchPublicExportIntrinsics,
  fetchPublicExportSentinels,
  fetchPublicExportWarframes,
  fetchPublicExportWeapons,
} from '@/lib/public-export/fetch-public-export'
import { getLocale, getTranslations } from 'next-intl/server'
import { MasteryPanel } from '../mastery/mastery-panel'
import { Window } from '../ui/window'
import { WindowContent } from '../ui/window-content'
import { WindowTitlebar } from '../ui/window-titlebar'

export async function MasteryChecklistWindow() {
  const t = await getTranslations('masteryChecklist')
  const locale = await getLocale()

  let masteryData: MasteryData | null = null
  let initialError: string | null = null

  try {
    const [dict, weaponsMap, warframesMap, sentinelsMap, intrinsicsMap] =
      await Promise.all([
        fetchPublicExportDictionary(locale),
        fetchPublicExportWeapons(),
        fetchPublicExportWarframes(),
        fetchPublicExportSentinels(),
        fetchPublicExportIntrinsics(),
      ])

    masteryData = buildMasteryData(
      dict,
      weaponsMap,
      warframesMap,
      sentinelsMap,
      intrinsicsMap
    )
  } catch {
    initialError = t('loadFailed')
  }

  return (
    <Window className="relative mt-0 h-[calc(100svh-5.5rem)] min-h-75 max-w-none md:mt-10 md:h-[85svh]">
      <WindowTitlebar>
        <p>{t('title')}</p>
      </WindowTitlebar>
      <WindowContent className="min-h-0 p-2">
        <MasteryPanel masteryData={masteryData} initialError={initialError} />
      </WindowContent>
    </Window>
  )
}
