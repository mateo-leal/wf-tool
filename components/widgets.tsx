import { getDictionary } from '@/lib/language'
import { getLocale } from 'next-intl/server'
import { WorldCyclesWidget } from './world-cycles-widget'

export default async function Widgets() {
  const locale = await getLocale()

  const dict = await getDictionary(locale)
  const osDict = await getDictionary(locale, 'oracle')

  return (
    <div className="w-full rounded border border-muted-primary/60 bg-background/75 p-3 shadow-[0_10px_30px_rgba(0,0,0,0.35)] backdrop-blur-[2px]">
      <WorldCyclesWidget dict={dict} osDict={osDict} />
    </div>
  )
}
