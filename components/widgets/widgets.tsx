import { WorldCyclesWidget } from './world-cycles-widget'
import { NewsWidget } from './news-widget'

export default function Widgets() {
  return (
    <div className="flex w-full flex-col gap-3">
      <div className="border border-muted-primary/60 bg-background/75 p-3">
        <WorldCyclesWidget />
      </div>
      <NewsWidget />
    </div>
  )
}
