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
import { useEffect, useState } from 'react'

import { cn, counterToString } from '@/lib/utils'
import { getChecklistTaskCounter } from '@/lib/checklist'
import { ChecklistCounter, ChecklistTask } from '@/lib/checklist/types'

import { Button } from '../ui/button'
import { useGameData } from '../providers/game-data'

interface TaskRowProps {
  task: ChecklistTask
  checked: boolean
  checkable?: boolean
  isHidden?: boolean
  onToggle: () => void
  onToggleHidden: () => void
}

export function TaskRow({
  task,
  checked,
  checkable = true,
  isHidden = false,
  onToggle,
  onToggleHidden,
}: TaskRowProps) {
  const t = useTranslations()
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
            'text-sm leading-relaxed',
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
            <TaskMeta task={task} />
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

function TaskMeta({ task }: { task: ChecklistTask }) {
  const t = useTranslations()

  const items = [
    {
      condition: !!task.dynamicInfo,
      icon: TreasureChestIcon,
      label: task.dynamicInfo,
      className: 'text-primary',
    },
    {
      condition: !!task.resets,
      icon: ClockCountdownIcon,
      label: task.resets && <Counter task={task} />,
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

function Counter({ task }: { task: ChecklistTask }) {
  const t = useTranslations()
  const { worldState } = useGameData()
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true)
  }, [])

  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    if (!task.resets) {
      return
    }

    const interval = window.setInterval(() => {
      setNow(new Date())
    }, 1000)

    return () => clearInterval(interval)
  }, [task.resets])

  if (!isMounted || !task.resets) return null

  const counter: ChecklistCounter | undefined = getChecklistTaskCounter(
    task,
    now,
    worldState
  )

  if (!counter) return null

  return t.rich(`checklist.counters.${counter.label}`, {
    time: counterToString(counter.time, t),
  })
}
