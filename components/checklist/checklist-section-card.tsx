import { useMemo, useState } from 'react'
import { Button } from '../ui/button'
import { ChecklistTask } from '@/lib/types'
import { BaroApiData } from '@/lib/checklist'
import { TaskRow } from './task-row'
import {
  BroomIcon,
  CaretDownIcon,
  CaretRightIcon,
  EyeIcon,
  EyeSlashIcon,
} from '@phosphor-icons/react'
import { useTranslations } from 'next-intl'

function collectVisibleCheckableTasks(
  tasks: ChecklistTask[],
  hidden: Record<string, boolean>
): ChecklistTask[] {
  return tasks.flatMap((task) => {
    if (hidden[task.id]) {
      return []
    }

    const childTasks = task.subitems
      ? collectVisibleCheckableTasks(task.subitems, hidden)
      : []

    const isGroup = Boolean(task.subitems && task.subitems.length > 0)
    const isCheckable =
      task.checkable === true || (!isGroup && task.checkable !== false)

    if (!isCheckable) {
      return childTasks
    }

    return [task, ...childTasks]
  })
}

function collectHiddenTasks(
  tasks: ChecklistTask[],
  hidden: Record<string, boolean>
): ChecklistTask[] {
  return tasks.flatMap((task) => {
    if (hidden[task.id]) {
      return [task]
    }

    return task.subitems ? collectHiddenTasks(task.subitems, hidden) : []
  })
}

export function ChecklistSectionCard({
  title,
  subtitle,
  tasks,
  now,
  completed,
  hidden,
  baroApi,
  onToggle,
  onToggleHidden,
  onClear,
  expandedGroups,
  onExpandedGroupsChange,
}: {
  title: string
  subtitle: string
  tasks: ChecklistTask[]
  now: Date
  completed: Record<string, boolean>
  hidden: Record<string, boolean>
  baroApi?: BaroApiData
  onToggle: (taskId: string) => void
  onToggleHidden: (taskId: string) => void
  onClear: () => void
  expandedGroups: Record<string, boolean>
  onExpandedGroupsChange: (next: Record<string, boolean>) => void
}) {
  const t = useTranslations()
  const [showHiddenItems, setShowHiddenItems] = useState(false)

  const visibleTasks = useMemo(
    () =>
      tasks.flatMap((task) => {
        if (hidden[task.id] && !showHiddenItems) {
          return []
        }

        if (!task.subitems || task.subitems.length === 0) {
          return [task]
        }

        const displaySubitems = showHiddenItems
          ? task.subitems
          : task.subitems.filter((subitem) => !hidden[subitem.id])

        if (displaySubitems.length === 0 && !hidden[task.id]) {
          return []
        }

        return [
          {
            ...task,
            subitems: displaySubitems,
          },
        ]
      }),
    [hidden, showHiddenItems, tasks]
  )

  const checkableTasks = useMemo(
    () => collectVisibleCheckableTasks(tasks, hidden),
    [hidden, tasks]
  )

  const hiddenTasks = useMemo(
    () => collectHiddenTasks(tasks, hidden),
    [hidden, tasks]
  )

  const completedCount = useMemo(
    () => checkableTasks.filter((task) => Boolean(completed[task.id])).length,
    [checkableTasks, completed]
  )

  return (
    <section className="flex min-h-0 flex-col border border-muted-primary bg-background/70">
      <header className="border-b border-muted-primary bg-cathedrale/70 px-3 py-2">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-title text-lg uppercase tracking-wide text-primary">
              {title}
            </h2>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-foreground">
              {t('checklist.doneCount', {
                count: completedCount,
                total: checkableTasks.length,
              })}
            </p>
            <div className="mt-1 flex justify-end gap-1">
              {hiddenTasks.length > 0 ? (
                <Button
                  size="sm"
                  variant={showHiddenItems ? 'default' : 'outline'}
                  onClick={() => setShowHiddenItems((previous) => !previous)}
                  aria-label={
                    showHiddenItems
                      ? t('checklist.hideHiddenItems')
                      : t('checklist.showHiddenItems', {
                          count: hiddenTasks.length,
                        })
                  }
                  title={
                    showHiddenItems
                      ? t('checklist.hideHiddenItems')
                      : t('checklist.showHiddenItems', {
                          count: hiddenTasks.length,
                        })
                  }
                  className="size-6 px-0"
                >
                  {showHiddenItems ? (
                    <EyeIcon size={14} weight="bold" />
                  ) : (
                    <EyeSlashIcon size={14} weight="bold" />
                  )}
                </Button>
              ) : null}
              <Button
                size="sm"
                variant="outline"
                onClick={onClear}
                aria-label={t('ui.clear')}
                title={t('ui.clear')}
                className="size-6 px-0"
              >
                <BroomIcon size={14} weight="bold" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 space-y-2 overflow-y-auto p-2">
        {visibleTasks.map((task) => {
          if (!task.subitems || task.subitems.length === 0) {
            return (
              <TaskRow
                key={task.id}
                task={task}
                now={now}
                checked={Boolean(completed[task.id])}
                checkable={task.checkable}
                isHidden={Boolean(hidden[task.id])}
                baroApi={baroApi}
                onToggle={() => onToggle(task.id)}
                onToggleHidden={() => onToggleHidden(task.id)}
              />
            )
          }

          const isExpanded = Boolean(expandedGroups[task.id])

          return (
            <section
              key={task.id}
              className="border border-muted-primary/70 bg-background/30"
            >
              <div className="flex items-center justify-between gap-3 px-2 py-2 transition hover:bg-muted-primary/10">
                <button
                  type="button"
                  className="min-w-0 flex-1 text-left"
                  aria-expanded={isExpanded}
                  onClick={() =>
                    onExpandedGroupsChange({
                      ...expandedGroups,
                      [task.id]: !isExpanded,
                    })
                  }
                >
                  <p className="text-sm leading-tight text-foreground">
                    {task.title as string}
                  </p>
                  {task.info && (
                    <p className="text-xs text-muted-foreground">
                      {t(task.info)}
                    </p>
                  )}
                </button>
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onToggleHidden(task.id)}
                    aria-label={hidden[task.id] ? t('ui.show') : t('ui.hide')}
                    title={hidden[task.id] ? t('ui.show') : t('ui.hide')}
                    className="size-6 px-0"
                  >
                    {hidden[task.id] ? (
                      <EyeIcon size={14} weight="bold" />
                    ) : (
                      <EyeSlashIcon size={14} weight="bold" />
                    )}
                  </Button>
                  <Button
                    aria-expanded={isExpanded}
                    onClick={() =>
                      onExpandedGroupsChange({
                        ...expandedGroups,
                        [task.id]: !isExpanded,
                      })
                    }
                    variant="ghost"
                    size="sm"
                    className="size-6 px-0"
                    aria-label={isExpanded ? t('ui.collapse') : t('ui.expand')}
                    title={isExpanded ? t('ui.collapse') : t('ui.expand')}
                  >
                    {isExpanded ? (
                      <CaretDownIcon size={14} weight="bold" />
                    ) : (
                      <CaretRightIcon size={14} weight="bold" />
                    )}
                  </Button>
                </div>
              </div>

              {isExpanded ? (
                <div className="space-y-2 p-2 pt-0">
                  {task.subitems.map((subitem) => (
                    <TaskRow
                      key={subitem.id}
                      task={subitem}
                      now={now}
                      checked={Boolean(completed[subitem.id])}
                      checkable={subitem.checkable}
                      isHidden={Boolean(hidden[subitem.id])}
                      baroApi={baroApi}
                      onToggle={() => onToggle(subitem.id)}
                      onToggleHidden={() => onToggleHidden(subitem.id)}
                    />
                  ))}
                </div>
              ) : null}
            </section>
          )
        })}
      </div>
    </section>
  )
}
