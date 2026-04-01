import { ChecklistTask } from '@/lib/types'
import { getChecklistTaskCounter } from '@/lib/checklist'
import {
  AppWindowIcon,
  CheckCircleIcon,
  ClockCountdownIcon,
  MapPinIcon,
  UserIcon,
  XIcon,
} from '@phosphor-icons/react'
import { useTranslations } from 'next-intl'

export function TaskRow({
  task,
  now,
  checked,
  checkable = true,
  onToggle,
}: {
  task: ChecklistTask
  now: Date
  checked: boolean
  checkable?: boolean
  onToggle: () => void
}) {
  const t = useTranslations()
  const counter = getChecklistTaskCounter(task, now)
  const hasMetaItems = Boolean(
    task.location || task.terminal || task.prerequisite || task.npc || counter
  )

  if (!checkable) {
    return (
      <div className="flex w-full items-start gap-2 border border-muted-primary/70 bg-cathedrale/45 p-2 text-left">
        <span className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center border border-muted-primary text-[11px] leading-none text-primary">
          i
        </span>
        <span className="min-w-0">
          <p className="text-sm leading-tight text-foreground">
            {t(task.title)}
          </p>
          {task.info && (
            <p className="mt-1 text-xs leading-snug text-muted-foreground">
              {t(task.info)}
            </p>
          )}
          {hasMetaItems ? (
            <ul className="mt-1 text-xs leading-snug text-muted-foreground">
              {counter && (
                <li className="text-primary">
                  <ClockCountdownIcon size={14} className="inline-block mr-1" />
                  {t(`checklist.counters.${counter.label}`, {
                    time: counter.time,
                  })}
                </li>
              )}
              {task.location && (
                <li>
                  <MapPinIcon
                    size={14}
                    className="inline-block mr-1"
                    alt={t('locations.title')}
                  />
                  {t(task.location)}
                </li>
              )}
              {task.terminal && (
                <li>
                  <AppWindowIcon
                    size={14}
                    className="inline-block mr-1"
                    alt={t('terminal.title')}
                  />
                  {t(task.terminal)}
                </li>
              )}
              {task.npc && (
                <li>
                  <UserIcon
                    size={14}
                    className="inline-block mr-1"
                    alt={t('npcs.title')}
                  />
                  {t(task.npc)}
                </li>
              )}
              {task.prerequisite && (
                <li>
                  <CheckCircleIcon
                    size={14}
                    className="inline-block mr-1"
                    alt={t('checklist.prerequisite')}
                  />
                  {t(task.prerequisite)}
                </li>
              )}
            </ul>
          ) : null}
        </span>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-start gap-2 border border-muted-primary/70 bg-background/50 p-2 text-left transition hover:bg-muted-primary/10"
      aria-pressed={checked}
    >
      <span
        className={[
          'mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center border text-[11px] leading-none',
          checked
            ? 'border-success-border bg-success-bg text-success'
            : 'border-muted-primary text-muted-foreground',
        ].join(' ')}
      >
        {checked ? <XIcon weight="bold" /> : ''}
      </span>
      <span className="min-w-0">
        <p
          className={[
            'text-sm leading-tight',
            checked ? 'text-muted-foreground line-through' : 'text-foreground',
          ].join(' ')}
        >
          {t(task.title)}
        </p>
        {task.info && (
          <p className="mt-1 text-xs leading-snug text-muted-foreground">
            {t(task.info)}
          </p>
        )}
        {hasMetaItems ? (
          <ul className="mt-1 text-xs leading-snug text-muted-foreground">
            {counter && (
              <li className="text-primary">
                <ClockCountdownIcon size={14} className="inline-block mr-1" />
                {t(`checklist.counters.${counter.label}`, {
                  time: counter.time,
                })}
              </li>
            )}
            {task.location && (
              <li>
                <MapPinIcon
                  size={14}
                  className="inline-block mr-1"
                  alt={t('locations.title')}
                />
                {t(task.location)}
              </li>
            )}
            {task.terminal && (
              <li>
                <AppWindowIcon
                  size={14}
                  className="inline-block mr-1"
                  alt={t('terminal.title')}
                />
                {t(task.terminal)}
              </li>
            )}
            {task.npc && (
              <li>
                <UserIcon
                  size={14}
                  className="inline-block mr-1"
                  alt={t('npcs.title')}
                />
                {t(task.npc)}
              </li>
            )}
            {task.prerequisite && (
              <li>
                <CheckCircleIcon
                  size={14}
                  className="inline-block mr-1"
                  alt={t('checklist.prerequisite')}
                />
                {t(task.prerequisite)}
              </li>
            )}
          </ul>
        ) : null}
      </span>
    </button>
  )
}
