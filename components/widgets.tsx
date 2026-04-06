import { getDictionary } from '@/lib/language'
import { getLocale } from 'next-intl/server'
import { WorldCyclesWidget } from './world-cycles-widget'
import { NewsWidget } from './news-widget'

export default async function Widgets() {
  const locale = await getLocale()

  const dict = await getDictionary(locale)
  const osDict = await getDictionary(locale, 'oracle')

  return (
    <div className="flex w-full flex-col gap-3">
      <div className="border border-muted-primary/60 bg-background/75 p-3">
        <WorldCyclesWidget dict={dict} osDict={osDict} />
      </div>
      <NewsWidget />
    </div>
  )
}
