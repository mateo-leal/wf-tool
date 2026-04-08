'use client'

import {
  CHECKLIST_TASKS,
  createEmptyChecklistState,
  formatRemainingTime,
  getDailyResetKey,
  getTimeUntilNextUtcDay,
  getTimeUntilNextUtcWeek,
  getWeeklyResetKey,
  isBaroKiteerAvailable,
  normalizeChecklistState,
  BaroApiData,
} from '@/lib/checklist'
import { useEffect, useRef, useState } from 'react'
import { CHECKLIST_STORAGE_KEY } from '@/lib/constants'
import { ChecklistState, ChecklistTask } from '@/lib/types'
import {
  fetchOracleWorldState,
  getVoidTrader,
  VoidTrader,
} from '@/lib/world-state/fetch-world-state'
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

function saveChecklistPanelState(checklistState: ChecklistState): void {
  try {
    localStorage.setItem(CHECKLIST_STORAGE_KEY, JSON.stringify(checklistState))
  } catch {
    // ignore storage errors
  }
}

export function ChecklistPanel() {
  const t = useTranslations()

  const [state, setState] = useState<ChecklistState>(() =>
    createEmptyChecklistState(new Date())
  )
  const [now, setNow] = useState(() => new Date())
  const [baro, setBaro] = useState<VoidTrader | null>(null)
  const skipFirstPersistRef = useRef(true)

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const current = new Date()
      setState(loadChecklistState(current))
    }, 0)

    return () => {
      window.clearTimeout(timeout)
    }
  }, [])

  useEffect(() => {
    if (skipFirstPersistRef.current) {
      skipFirstPersistRef.current = false
      return
    }

    saveChecklistPanelState(state)
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
              hidden: previous.daily.hidden,
              expandedGroups: previous.daily.expandedGroups,
            },
          }
        }

        if (nextState.weekly.periodKey !== nextWeekly) {
          nextState = {
            ...nextState,
            weekly: {
              periodKey: nextWeekly,
              completed: {},
              hidden: nextState.weekly.hidden,
              expandedGroups: nextState.weekly.expandedGroups,
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

  useEffect(() => {
    let isCancelled = false

    async function loadWorldState() {
      try {
        const worldState = await fetchOracleWorldState()
        if (!isCancelled) {
          setBaro(getVoidTrader(worldState))
        }
      } catch {
        if (!isCancelled) {
          setBaro(null)
        }
      }
    }

    void loadWorldState()

    const interval = window.setInterval(() => {
      void loadWorldState()
    }, 15 * 60_000) // every 15 minutes

    return () => {
      isCancelled = true
      window.clearInterval(interval)
    }
  }, [])

  function toggleTask(section: ChecklistSection, taskId: string) {
    setState((previous) => {
      if (section === 'other') {
        return {
          ...previous,
          other: {
            ...previous.other,
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
            ...previous.other,
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

  function toggleHidden(section: ChecklistSection, taskId: string) {
    setState((previous) => {
      if (section === 'other') {
        return {
          ...previous,
          other: {
            ...previous.other,
            hidden: {
              ...previous.other.hidden,
              [taskId]: !previous.other.hidden[taskId],
            },
          },
        }
      }

      return {
        ...previous,
        [section]: {
          ...previous[section],
          hidden: {
            ...previous[section].hidden,
            [taskId]: !previous[section].hidden[taskId],
          },
        },
      }
    })
  }

  const dailyResetCountdown = formatRemainingTime(getTimeUntilNextUtcDay(now))

  const weeklyResetCountdown = formatRemainingTime(getTimeUntilNextUtcWeek(now))

  const baroApi: BaroApiData | undefined = baro
    ? {
        activationMs: parseInt(baro.Activation.$date.$numberLong, 10),
        expiryMs: parseInt(baro.Expiry.$date.$numberLong, 10),
      }
    : undefined

  const isBaroAvailable = isBaroKiteerAvailable(now, baroApi)
  const dailyTasks: ChecklistTask[] = CHECKLIST_TASKS.daily
  const weeklyTasks: ChecklistTask[] = CHECKLIST_TASKS.weekly

  const otherTasks: ChecklistTask[] = (() => {
    const base = CHECKLIST_TASKS.other.filter(
      (task) => task.id !== 'other-baro'
    )

    const baroTaskTemplate = CHECKLIST_TASKS.other.find(
      (task) => task.id === 'other-baro'
    ) as ChecklistTask

    const resolvedBaroLocation = baro?.Node
      ? `locations.${baro.Node}`
      : 'checklist.other.relayLocationPending'

    const baroTask: ChecklistTask = {
      ...baroTaskTemplate,
      location: resolvedBaroLocation,
      checkable: isBaroAvailable,
    }

    if (isBaroAvailable) {
      return baroTask ? [baroTask, ...base] : base
    }

    return [baroTask, ...base]
  })()

  const otherSubtitle = t('checklist.other.description')

  return (
    <div className="grid min-h-0 flex-1 grid-cols-1 gap-2 xl:grid-cols-3">
      <ChecklistSectionCard
        title={t('checklist.daily.title')}
        subtitle={t('checklist.daily.description', {
          time: dailyResetCountdown,
        })}
        tasks={dailyTasks}
        now={now}
        completed={state.daily.completed}
        hidden={state.daily.hidden}
        onToggle={(taskId) => toggleTask('daily', taskId)}
        onToggleHidden={(taskId) => toggleHidden('daily', taskId)}
        onClear={() => clearSection('daily')}
        expandedGroups={state.daily.expandedGroups}
        onExpandedGroupsChange={(next) =>
          setState((previous) => ({
            ...previous,
            daily: {
              ...previous.daily,
              expandedGroups: next,
            },
          }))
        }
      />
      <ChecklistSectionCard
        title={t('checklist.weekly.title')}
        subtitle={t('checklist.weekly.description', {
          time: weeklyResetCountdown,
        })}
        tasks={weeklyTasks}
        now={now}
        completed={state.weekly.completed}
        hidden={state.weekly.hidden}
        onToggle={(taskId) => toggleTask('weekly', taskId)}
        onToggleHidden={(taskId) => toggleHidden('weekly', taskId)}
        onClear={() => clearSection('weekly')}
        expandedGroups={state.weekly.expandedGroups}
        onExpandedGroupsChange={(next) =>
          setState((previous) => ({
            ...previous,
            weekly: {
              ...previous.weekly,
              expandedGroups: next,
            },
          }))
        }
      />
      <ChecklistSectionCard
        title={t('checklist.other.title')}
        subtitle={otherSubtitle}
        tasks={otherTasks}
        now={now}
        completed={state.other.completed}
        hidden={state.other.hidden}
        baroApi={baroApi}
        onToggle={(taskId) => toggleTask('other', taskId)}
        onToggleHidden={(taskId) => toggleHidden('other', taskId)}
        onClear={() => clearSection('other')}
        expandedGroups={state.other.expandedGroups}
        onExpandedGroupsChange={(next) =>
          setState((previous) => ({
            ...previous,
            other: {
              ...previous.other,
              expandedGroups: next,
            },
          }))
        }
      />
    </div>
  )
}
