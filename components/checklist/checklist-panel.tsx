'use client'

import {
  CHECKLIST_TASKS,
  createEmptyChecklistState,
  formatRemainingTime,
  getDailyResetKey,
  getNextBaroAvailabilityStartUtc,
  getTimeUntilNextUtcDay,
  getTimeUntilNextUtcWeek,
  getWeeklyResetKey,
  isBaroKiteerAvailable,
  normalizeChecklistState,
} from '@/lib/checklist'
import { useEffect, useMemo, useRef, useState } from 'react'
import { CHECKLIST_STORAGE_KEY } from '@/lib/constants'
import { ChecklistState, ChecklistTask } from '@/lib/types'
import { useTranslations } from 'next-intl'
import { ChecklistSectionCard } from './checklist-section-card'

type ChecklistSection = 'daily' | 'weekly' | 'other'

function loadChecklistState(now: Date): ChecklistState {
  try {
    const raw = localStorage.getItem(CHECKLIST_STORAGE_KEY)
    if (!raw) {
      return createEmptyChecklistState(now)
    }

    return normalizeChecklistState(JSON.parse(raw), now)
  } catch {
    return createEmptyChecklistState(now)
  }
}

function saveChecklistState(state: ChecklistState): void {
  try {
    localStorage.setItem(CHECKLIST_STORAGE_KEY, JSON.stringify(state))
  } catch {
    // ignore storage errors
  }
}

export function ChecklistPanel() {
  const t = useTranslations()

  const [state, setState] = useState<ChecklistState>(() => {
    const current = new Date()
    if (typeof window === 'undefined') {
      return createEmptyChecklistState(current)
    }

    return loadChecklistState(current)
  })
  const [now, setNow] = useState(() => new Date())
  const skipFirstPersistRef = useRef(true)

  useEffect(() => {
    if (skipFirstPersistRef.current) {
      skipFirstPersistRef.current = false
      return
    }

    saveChecklistState(state)
  }, [state])

  useEffect(() => {
    const interval = window.setInterval(() => {
      const current = new Date()
      setNow(current)

      setState((previous) => {
        const nextDaily = getDailyResetKey(current)
        const nextWeekly = getWeeklyResetKey(current)

        let nextState = previous

        if (previous.daily.periodKey !== nextDaily) {
          nextState = {
            ...nextState,
            daily: {
              periodKey: nextDaily,
              completed: {},
            },
          }
        }

        if (nextState.weekly.periodKey !== nextWeekly) {
          nextState = {
            ...nextState,
            weekly: {
              periodKey: nextWeekly,
              completed: {},
            },
          }
        }

        return nextState
      })
    }, 30_000)

    return () => {
      window.clearInterval(interval)
    }
  }, [])

  function toggleTask(section: ChecklistSection, taskId: string) {
    setState((previous) => {
      if (section === 'other') {
        return {
          ...previous,
          other: {
            completed: {
              ...previous.other.completed,
              [taskId]: !previous.other.completed[taskId],
            },
          },
        }
      }

      return {
        ...previous,
        [section]: {
          ...previous[section],
          completed: {
            ...previous[section].completed,
            [taskId]: !previous[section].completed[taskId],
          },
        },
      }
    })
  }

  function clearSection(section: ChecklistSection) {
    setState((previous) => {
      if (section === 'other') {
        return {
          ...previous,
          other: {
            completed: {},
          },
        }
      }

      return {
        ...previous,
        [section]: {
          ...previous[section],
          completed: {},
        },
      }
    })
  }

  const dailyResetCountdown = useMemo(() => {
    return formatRemainingTime(getTimeUntilNextUtcDay(now))
  }, [now])

  const weeklyResetCountdown = useMemo(() => {
    return formatRemainingTime(getTimeUntilNextUtcWeek(now))
  }, [now])

  const dailyTasks = useMemo<ChecklistTask[]>(() => CHECKLIST_TASKS.daily, [])
  const weeklyTasks = useMemo<ChecklistTask[]>(() => CHECKLIST_TASKS.weekly, [])

  const otherTasks = useMemo<ChecklistTask[]>(() => {
    const isBaroAvailable = isBaroKiteerAvailable(now)
    const base = CHECKLIST_TASKS.other.filter(
      (task) => task.id !== 'other-baro'
    )

    if (isBaroAvailable) {
      const baroTask = CHECKLIST_TASKS.other.find(
        (task) => task.id === 'other-baro'
      )
      return baroTask ? [baroTask, ...base] : base
    }

    const nextStart = getNextBaroAvailabilityStartUtc(now)
    const remainingMs = Math.max(0, nextStart.getTime() - now.getTime())
    const remainingLabel = formatRemainingTime(remainingMs)

    const baroInfoTask: ChecklistTask = {
      id: 'other-baro-info',
      title: `Baro Ki'Teer arrives in ${remainingLabel}`,
      location: 'Relay with active Baro icon',
      terminal:
        'Biweekly weekend window (Friday 13:00 UTC to Sunday 13:00 UTC)',
      checkable: false,
    }

    return [baroInfoTask, ...base]
  }, [now])

  const otherSubtitle = 'Manual checklist for event/goal-based tasks'

  return (
    <div className="grid min-h-0 flex-1 grid-cols-1 gap-2 xl:grid-cols-3">
      <ChecklistSectionCard
        title={t('checklist.daily.title')}
        subtitle={t('checklist.daily.description', {
          time: dailyResetCountdown,
        })}
        tasks={dailyTasks}
        completed={state.daily.completed}
        onToggle={(taskId) => toggleTask('daily', taskId)}
        onClear={() => clearSection('daily')}
        defaultExpandedGroupIds={['daily-world-syndicates', 'daily-vendors']}
      />
      <ChecklistSectionCard
        title={t('checklist.weekly.title')}
        subtitle={t('checklist.weekly.description', {
          time: weeklyResetCountdown,
        })}
        tasks={weeklyTasks}
        completed={state.weekly.completed}
        onToggle={(taskId) => toggleTask('weekly', taskId)}
        onClear={() => clearSection('weekly')}
      />
      <ChecklistSectionCard
        title={t('checklist.other.title')}
        subtitle={otherSubtitle}
        tasks={otherTasks}
        completed={state.other.completed}
        onToggle={(taskId) => toggleTask('other', taskId)}
        onClear={() => clearSection('other')}
      />
    </div>
  )
}
