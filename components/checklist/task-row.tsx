import { ChecklistTask } from '@/lib/types'
import {
  AppWindowIcon,
  CheckCircleIcon,
  MapPinIcon,
  UserIcon,
  XIcon,
} from '@phosphor-icons/react'
import { useTranslations } from 'next-intl'

function getTaskMetaLines(task: ChecklistTask) {
  return [
    `Where: ${task.location ?? 'Not specified'}`,
    `Unlock: ${task.terminal ?? 'Not specified'}`,
  ]
}

export function TaskRow({
  task,
  checked,
  checkable = true,
  onToggle,
}: {
  task: ChecklistTask
  checked: boolean
  checkable?: boolean
  onToggle: () => void
}) {
  const t = useTranslations()
  const hasMetaItems = Boolean(
    task.location || task.terminal || task.prerequisite || task.npc
  )

  if (!checkable) {
    const [whereLine, unlockLine] = getTaskMetaLines(task)

    return (
      <div className="flex w-full items-start gap-2 border border-muted-primary/70 bg-cathedrale/45 p-2 text-left">
        <span className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center border border-muted-primary text-[11px] leading-none text-primary">
          i
        </span>
        <span className="min-w-0">
          <p className="text-sm leading-tight text-foreground">{task.title}</p>
          <p className="mt-1 text-xs leading-snug text-muted-foreground">
            {whereLine}
          </p>
          <p className="text-xs leading-snug text-muted-foreground">
            {unlockLine}
          </p>
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
