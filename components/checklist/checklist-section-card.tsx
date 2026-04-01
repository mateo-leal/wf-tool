import { useMemo, useState } from 'react'
import { Button } from '../ui/button'
import { ChecklistTask } from '@/lib/types'
import { TaskRow } from './task-row'
import { useTranslations } from 'next-intl'

function collectCheckableTasks(tasks: ChecklistTask[]): ChecklistTask[] {
  return tasks.flatMap((task) => {
    const childTasks = task.subitems ? collectCheckableTasks(task.subitems) : []

    const isGroup = Boolean(task.subitems && task.subitems.length > 0)
    const isCheckable =
      task.checkable === true || (!isGroup && task.checkable !== false)

    if (!isCheckable) {
      return childTasks
    }

    return [task, ...childTasks]
  })
}

export function ChecklistSectionCard({
  title,
  subtitle,
  tasks,
  now,
  completed,
  onToggle,
  onClear,
  defaultExpandedGroupIds = [],
}: {
  title: string
  subtitle: string
  tasks: ChecklistTask[]
  now: Date
  completed: Record<string, boolean>
  onToggle: (taskId: string) => void
  onClear: () => void
  defaultExpandedGroupIds?: string[]
}) {
  const t = useTranslations()
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    () => Object.fromEntries(defaultExpandedGroupIds.map((id) => [id, true]))
  )

  const checkableTasks = useMemo(() => collectCheckableTasks(tasks), [tasks])

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
            <Button size="sm" variant="outline" onClick={onClear}>
              {t('ui.clear')}
            </Button>
          </div>
        </div>
      </header>

      <div className="flex-1 space-y-2 overflow-y-auto p-2">
        {tasks.map((task) => {
          if (!task.subitems || task.subitems.length === 0) {
            return (
              <TaskRow
                key={task.id}
                task={task}
                now={now}
                checked={Boolean(completed[task.id])}
                checkable={task.checkable}
                onToggle={() => onToggle(task.id)}
              />
            )
          }

          const isExpanded = Boolean(expandedGroups[task.id])

          return (
            <section
              key={task.id}
              className="border border-muted-primary/70 bg-background/30"
            >
              <button
                type="button"
                className="flex w-full items-start justify-between gap-3 px-2 py-2 text-left transition hover:bg-muted-primary/10"
                aria-expanded={isExpanded}
                onClick={() =>
                  setExpandedGroups((previous) => ({
                    ...previous,
                    [task.id]: !isExpanded,
                  }))
                }
              >
                <span>
                  <p className="text-sm leading-tight text-foreground">
                    {t(task.title)}
                  </p>
                  {task.info && (
                    <p className="text-xs text-muted-foreground">
                      {t(task.info)}
                    </p>
                  )}
                </span>
                <span className="text-xs text-primary">
                  {isExpanded ? t('ui.hide') : t('ui.expand')}
                </span>
              </button>

              {isExpanded ? (
                <div className="space-y-2 p-2 pt-0">
                  {task.subitems.map((subitem) => (
                    <TaskRow
                      key={subitem.id}
                      task={subitem}
                      now={now}
                      checked={Boolean(completed[subitem.id])}
                      checkable={subitem.checkable}
                      onToggle={() => onToggle(subitem.id)}
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
