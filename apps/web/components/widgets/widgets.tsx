import { WorldCyclesWidget } from './world-cycles-widget'
import { NewsWidget } from './news-widget'
import { FactionProvider, RegionProvider } from '@tenno-companion/core/server'
import { getLocale } from 'next-intl/server'

export default async function Widgets() {
  const locale = await getLocale()
  const factions = await FactionProvider.create({ locale })
  const regions = await RegionProvider.create({ locale })
  return (
    <div className="flex w-full flex-col gap-3">
      <div className="border border-muted-primary/60 bg-background/75 p-3">
        <WorldCyclesWidget
          factions={factions.getAll()}
          regions={regions.filter(
            (r) =>
              // Plains of Eidolon
              r.uniqueName === 'SolNode228' ||
              // Orb Vallis
              r.uniqueName === 'SolNode129' ||
              // Cambion Drift
              r.uniqueName === 'SolNode229' ||
              // The Duviri Experience - Duviri system
              r.uniqueName === 'SolNode236' ||
              // Everview Arc - Zariman system
              r.uniqueName === 'SolNode230'
          )}
        />
      </div>
      <NewsWidget />
    </div>
  )
}
