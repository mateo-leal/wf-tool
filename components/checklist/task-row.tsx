import { ChecklistCounter, ChecklistTask } from '@/lib/types'
import { Button } from '../ui/button'
import { BaroApiData, getChecklistTaskCounter } from '@/lib/checklist'
import {
  AppWindowIcon,
  CheckCircleIcon,
  ClockCountdownIcon,
  EyeIcon,
  EyeSlashIcon,
  MapPinIcon,
  TreasureChestIcon,
  UserIcon,
  XIcon,
} from '@phosphor-icons/react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils' // Standard utility for tailwind classes

interface TaskRowProps {
  task: ChecklistTask
  now: Date
  checked: boolean
  checkable?: boolean
  isHidden?: boolean
  baroApi?: BaroApiData
  onToggle: () => void
  onToggleHidden: () => void
}

export function TaskRow({
  task,
  now,
  checked,
  checkable = true,
  isHidden = false,
  baroApi,
  onToggle,
  onToggleHidden,
}: TaskRowProps) {
  const t = useTranslations()
  const counter = getChecklistTaskCounter(task, now, baroApi)
  // Logic for showing details: always show if not checkable, or show if not checked
  const showDetails = !checkable || !checked

  const Content = (
    <>
      <div
        className={cn(
          'mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center border text-[11px] leading-none',
          !checkable && 'border-muted-primary text-primary',
          checkable &&
            checked &&
            'border-success-border bg-success-bg text-success',
          checkable && !checked && 'border-muted-primary text-muted-foreground'
        )}
      >
        {!checkable ? 'i' : checked ? <XIcon weight="bold" /> : null}
      </div>
      <div className="min-w-0">
        <p
          className={cn(
            'text-sm leading-tight',
            checkable && checked
              ? 'text-muted-foreground line-through'
              : 'text-foreground'
          )}
        >
          {task.title as string}{' '}
          {task.steelPath && <span>({t('common.steelPath')})</span>}
        </p>
        {showDetails && (
          <>
            {task.info && (
              <p className="mt-1 text-xs leading-snug text-muted-foreground">
                {t(task.info)}
              </p>
            )}
            <TaskMeta task={task} counter={counter} />
          </>
        )}
      </div>
    </>
  )

  return (
    <div
      className={cn(
        'flex w-full items-start justify-between gap-3 border border-muted-primary/70 p-2 text-left transition',
        !checkable
          ? 'bg-cathedrale/45'
          : 'bg-background/50 hover:bg-muted-primary/10'
      )}
    >
      {checkable ? (
        <button
          type="button"
          onClick={onToggle}
          className="flex min-w-0 flex-1 items-start gap-2 text-left"
          aria-pressed={checked}
        >
          {Content}
        </button>
      ) : (
        <div className="flex min-w-0 items-start gap-2">{Content}</div>
      )}

      <Button
        size="sm"
        variant="ghost"
        onClick={onToggleHidden}
        aria-label={isHidden ? t('ui.show') : t('ui.hide')}
        title={isHidden ? t('ui.show') : t('ui.hide')}
        className="size-6 px-0"
      >
        {isHidden ? (
          <EyeIcon size={14} weight="bold" />
        ) : (
          <EyeSlashIcon size={14} weight="bold" />
        )}
      </Button>
    </div>
  )
}

function TaskMeta({
  task,
  counter,
}: {
  task: ChecklistTask
  counter: ChecklistCounter | undefined
}) {
  const t = useTranslations()

  const items = [
    {
      condition: !!task.dynamicInfo,
      icon: TreasureChestIcon,
      label: task.dynamicInfo,
      className: 'text-primary',
    },
    {
      condition: !!counter,
      icon: ClockCountdownIcon,
      label:
        counter &&
        t(`checklist.counters.${counter.label}`, { time: counter.time }),
      className: 'text-primary',
    },
    {
      condition: !!task.location,
      icon: MapPinIcon,
      label:
        task.location &&
        (typeof task.location === 'string'
          ? task.location
          : task.location.map((label) => label.key).join(', ')),
      alt: t('locations.title'),
    },
    {
      condition: !!task.terminal,
      icon: AppWindowIcon,
      label:
        typeof task.terminal === 'string' ? task.terminal : task.terminal?.key,
      alt: t('terminal.title'),
    },
    {
      condition: !!task.npc,
      icon: UserIcon,
      label: typeof task.npc === 'string' ? task.npc : task.npc?.key,
      alt: t('npcs.title'),
    },
    {
      condition: !!task.prerequisite,
      icon: CheckCircleIcon,
      label:
        typeof task.prerequisite === 'string'
          ? task.prerequisite
          : task.prerequisite?.key,
      alt: t('checklist.prerequisite'),
    },
    {
      condition: !!task.syndicateRank,
      icon: CheckCircleIcon,
      label: task.syndicateRank
        ? t('prerequisites.syndicateRank', {
            syndicate: task.syndicateRank.syndicate as string,
            rank: task.syndicateRank.rank,
          })
        : undefined,
      alt: t('checklist.prerequisite'),
    },
  ]

  if (!items.some((i) => i.condition)) return null

  return (
    <ul className="mt-1 text-xs leading-snug text-muted-foreground">
      {items.map(
        (item, idx) =>
          item.condition && (
            <li key={idx} className={item.className}>
              <item.icon
                size={14}
                className="mr-1 inline-block"
                alt={item.alt}
              />
              {item.label}
            </li>
          )
      )}
    </ul>
  )
}
