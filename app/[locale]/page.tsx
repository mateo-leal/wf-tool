import { Link } from '@/i18n/navigation'
import {
  ChatCircleTextIcon,
  ListChecksIcon,
  MedalMilitaryIcon,
} from '@phosphor-icons/react/ssr'

const DESKTOP_SHORTCUTS = [
  {
    href: 'checklist',
    label: 'Checklist',
    Icon: ListChecksIcon,
  },
  {
    href: 'kim',
    label: 'KIM',
    Icon: ChatCircleTextIcon,
  },
  {
    href: 'mastery',
    label: 'Mastery Checklist',
    Icon: MedalMilitaryIcon,
  },
]

export default function Home() {
  return (
    <section className="relative flex min-h-0 flex-1 items-start">
      <div className="flex flex-col gap-3 pt-2">
        {DESKTOP_SHORTCUTS.map(({ href, label, Icon }) => (
          <Link
            key={href}
            href={href}
            className="group flex w-26 flex-col items-center gap-2 rounded border border-transparent p-2 transition hover:border-muted-primary/70 hover:bg-background/30 focus-visible:border-muted-primary/80 focus-visible:bg-background/35"
            aria-label={`Open ${label}`}
            title={label}
          >
            <span className="inline-flex size-14 items-center justify-center border border-muted-primary bg-cathedrale/70 text-primary shadow-[0_0_0_1px_rgba(0,0,0,0.2)] transition group-hover:scale-105 group-hover:bg-cathedrale/85">
              <Icon size={34} weight="regular" />
            </span>
            <span className="bg-background/70 px-1 text-center text-sm leading-tight text-foreground">
              {label}
            </span>
          </Link>
        ))}
      </div>
    </section>
  )
}
