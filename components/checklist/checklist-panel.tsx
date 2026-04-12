'use client'

import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useRef, useState, useMemo } from 'react'
import {
  CHECKLIST_TASKS,
  clearExpiredOtherCompletions,
  createEmptyChecklistState,
  formatRemainingTime,
  getBaroPeriodKey,
  getDailyResetKey,
  getEightHoursPeriodKey,
  getTimeUntilNextUtcDay,
  getTimeUntilNextUtcWeek,
  getWeeklyResetKey,
  isBaroKiteerAvailable,
  normalizeChecklistState,
  BaroApiData,
} from '@/lib/checklist'
import { CHECKLIST_STORAGE_KEY } from '@/lib/constants'
import { ChecklistState, ChecklistTask, LabelExternal } from '@/lib/types'
import { ChecklistSectionCard } from './checklist-section-card'
import { toTitleCase } from '@/lib/utils'
import { useGameData } from '../providers/game-data'

type ChecklistSection = 'daily' | 'weekly' | 'other'

function loadChecklistState(now: Date): ChecklistState {
  try {
    const raw = localStorage.getItem(CHECKLIST_STORAGE_KEY)
    return raw
      ? normalizeChecklistState(JSON.parse(raw), now)
      : createEmptyChecklistState(now)
  } catch {
    return createEmptyChecklistState(now)
  }
}

export function ChecklistPanel() {
  const t = useTranslations()
  const {
    worldState,
    dictionaries,
    exportData,
    fetchDictionary,
    fetchExportData,
  } = useGameData()

  const [state, setState] = useState<ChecklistState>(() =>
    createEmptyChecklistState(new Date())
  )
  const [now, setNow] = useState(() => new Date())
  const skipFirstPersistRef = useRef(true)

  useEffect(() => {
    void fetchDictionary('default')
    void fetchDictionary('oracle')
    void fetchExportData('missionTypes')
    void fetchExportData('regions')
  }, [fetchDictionary, fetchExportData])

  useEffect(() => {
    setState(loadChecklistState(new Date()))
    const interval = window.setInterval(() => {
      const current = new Date()
      setNow(current)
      setState((prev) => {
        const nextDaily = getDailyResetKey(current)
        const nextWeekly = getWeeklyResetKey(current)
        const nextEightHours = getEightHoursPeriodKey(current)
        const nextBaro = getBaroPeriodKey(current)

        const next = { ...prev }
        if (prev.daily.periodKey !== nextDaily) {
          next.daily = { ...next.daily, periodKey: nextDaily, completed: {} }
        }
        if (prev.weekly.periodKey !== nextWeekly) {
          next.weekly = { ...next.weekly, periodKey: nextWeekly, completed: {} }
        }

        const eExpired = next.other.eightHoursPeriodKey !== nextEightHours
        const bExpired = next.other.baroPeriodKey !== nextBaro
        if (eExpired || bExpired) {
          next.other = {
            ...next.other,
            eightHoursPeriodKey: nextEightHours,
            baroPeriodKey: nextBaro,
            completed: clearExpiredOtherCompletions(next.other.completed, {
              eightHours: eExpired,
              baro: bExpired,
            }),
          }
        }
        return next
      })
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (skipFirstPersistRef.current)
      return void (skipFirstPersistRef.current = false)
    localStorage.setItem(CHECKLIST_STORAGE_KEY, JSON.stringify(state))
  }, [state])

  const applyDictionaryTitles = useCallback(
    function resolver(tasks: ChecklistTask[]): ChecklistTask[] {
      const dict = dictionaries['default'] || {}
      const dictOracle = dictionaries['oracle'] || {}

      return tasks.map((task) => {
        const resolve = (
          obj: string | LabelExternal | undefined
        ): string | undefined => {
          if (!obj) return undefined
          if (typeof obj === 'string') return t(obj)
          const label =
            obj.source === 'oracle' ? dictOracle[obj.key] : dict[obj.key]
          return label ?? t('ui.loading')
        }

        const resolveLocation = (
          loc: string | LabelExternal[] | undefined
        ): string | undefined => {
          if (!loc) return undefined
          if (Array.isArray(loc)) {
            return loc
              .map(
                (l) =>
                  (l.source === 'oracle' ? dictOracle[l.key] : dict[l.key]) ??
                  t('ui.loading')
              )
              .join(', ')
          }
          return loc.startsWith('locations.') ? t(loc) : loc
        }

        return {
          ...task,
          title: resolve(task.title) || '',
          prerequisite: resolve(task.prerequisite),
          location: resolveLocation(task.location),
          terminal: resolve(task.terminal),
          npc: resolve(task.npc),
          syndicateRank: task.syndicateRank
            ? {
                ...task.syndicateRank,
                syndicate: resolve(task.syndicateRank.syndicate) || '',
              }
            : undefined,
          subitems: task.subitems ? resolver(task.subitems) : undefined,
        } as ChecklistTask
      })
    },
    [dictionaries, t]
  )

  const archonRewardLabel = useMemo(() => {
    const sortie = worldState?.LiteSorties?.[0]
    const mTypes = exportData.missionTypes
    const dict = dictionaries['default']
    if (!sortie || !mTypes || !dict) return null

    const boss = toTitleCase(sortie.Boss.replace('SORTIE_BOSS_', ''))
    const missions = sortie.Missions.map((m) => {
      const key = mTypes[m.missionType]?.name
      return key && dict[key] ? toTitleCase(dict[key]) : m.missionType
    }).join(', ')

    return `${boss} (${missions})`
  }, [worldState, exportData.missionTypes, dictionaries])

  const teshinRewardLabel = useMemo(() => {
    const EPOCH = 1736121600 * 1000
    const week = Math.trunc((now.getTime() - EPOCH) / 604800000)
    const rewards = [
      'umbraForma',
      'kuva',
      'kitgunRiven',
      'forma',
      'zawRiven',
      'endo',
      'rifleRiven',
      'shotgunRiven',
    ]
    return `${t('rewards')}: ${t(`teshinOffers.${rewards[week % 8]}`)}`
  }, [now, t])

  const baro = worldState?.VoidTraders?.[0] || null
  const baroApi: BaroApiData | undefined = baro
    ? {
        activationMs: Number(baro.Activation.$date.$numberLong),
        expiryMs: Number(baro.Expiry.$date.$numberLong),
      }
    : undefined
  const isBaroAvailable = isBaroKiteerAvailable(now, baroApi)

  const dailyTasks = useMemo(
    () => applyDictionaryTitles(CHECKLIST_TASKS.daily),
    [applyDictionaryTitles]
  )

  const weeklyTasks = useMemo(
    () =>
      applyDictionaryTitles(
        CHECKLIST_TASKS.weekly.map((task) => {
          if (task.id === 'weekly-archon-hunt')
            return { ...task, dynamicInfo: archonRewardLabel ?? undefined }
          if (task.id === 'weekly-vendors' && task.subitems) {
            return {
              ...task,
              subitems: task.subitems.map((si) =>
                si.id === 'weekly-vendor-teshin'
                  ? { ...si, dynamicInfo: teshinRewardLabel }
                  : si
              ),
            }
          }
          return task
        })
      ),
    [applyDictionaryTitles, archonRewardLabel, teshinRewardLabel]
  )

  const otherTasks = useMemo(() => {
    const base = CHECKLIST_TASKS.other.filter((t) => t.id !== 'other-baro')
    const template = CHECKLIST_TASKS.other.find(
      (t) => t.id === 'other-baro'
    ) as ChecklistTask

    let baroLocation = t('checklist.other.relayLocationPending')
    const region = baro?.Node ? exportData.regions?.[baro.Node] : null
    const dict = dictionaries.default

    if (region && dict) {
      const regionName = dict[region.name]
      const systemName = dict[region.systemName]
      baroLocation =
        regionName && systemName ? `${regionName}, ${systemName}` : baro!.Node
    } else if (baro?.Node) {
      baroLocation = baro.Node
    }

    const baroTask: ChecklistTask = {
      ...template,
      location: baroLocation,
      checkable: isBaroAvailable,
    }

    return applyDictionaryTitles([baroTask, ...base])
  }, [
    baro,
    exportData.regions,
    dictionaries,
    isBaroAvailable,
    t,
    applyDictionaryTitles,
  ])

  const toggleTask = (section: ChecklistSection, id: string) => {
    setState((current) => ({
      ...current,
      [section]: {
        ...current[section],
        completed: {
          ...current[section].completed,
          [id]: !current[section].completed[id],
        },
      },
    }))
  }
  const toggleHidden = (s: ChecklistSection, id: string) => {
    setState((p) => ({
      ...p,
      [s]: { ...p[s], hidden: { ...p[s].hidden, [id]: !p[s].hidden[id] } },
    }))
  }

  return (
    <div className="grid min-h-0 flex-1 grid-cols-1 gap-2 xl:grid-cols-3">
      <ChecklistSectionCard
        title={t('checklist.daily.title')}
        subtitle={t('checklist.daily.description', {
          time: formatRemainingTime(getTimeUntilNextUtcDay(now)),
        })}
        tasks={dailyTasks}
        now={now}
        completed={state.daily.completed}
        hidden={state.daily.hidden}
        onToggle={(id) => toggleTask('daily', id)}
        onToggleHidden={(id) => toggleHidden('daily', id)}
        onClear={() =>
          setState((p) => ({ ...p, daily: { ...p.daily, completed: {} } }))
        }
        expandedGroups={state.daily.expandedGroups}
        onExpandedGroupsChange={(next) =>
          setState((p) => ({
            ...p,
            daily: { ...p.daily, expandedGroups: next },
          }))
        }
      />
      <ChecklistSectionCard
        title={t('checklist.weekly.title')}
        subtitle={t('checklist.weekly.description', {
          time: formatRemainingTime(getTimeUntilNextUtcWeek(now)),
        })}
        tasks={weeklyTasks}
        now={now}
        completed={state.weekly.completed}
        hidden={state.weekly.hidden}
        onToggle={(id) => toggleTask('weekly', id)}
        onToggleHidden={(id) => toggleHidden('weekly', id)}
        onClear={() =>
          setState((p) => ({ ...p, weekly: { ...p.weekly, completed: {} } }))
        }
        expandedGroups={state.weekly.expandedGroups}
        onExpandedGroupsChange={(next) =>
          setState((p) => ({
            ...p,
            weekly: { ...p.weekly, expandedGroups: next },
          }))
        }
      />
      <ChecklistSectionCard
        title={t('checklist.other.title')}
        subtitle={t('checklist.other.description')}
        tasks={otherTasks}
        now={now}
        completed={state.other.completed}
        hidden={state.other.hidden}
        baroApi={baroApi}
        onToggle={(id) => toggleTask('other', id)}
        onToggleHidden={(id) => toggleHidden('other', id)}
        onClear={() =>
          setState((p) => ({ ...p, other: { ...p.other, completed: {} } }))
        }
        expandedGroups={state.other.expandedGroups}
        onExpandedGroupsChange={(next) =>
          setState((p) => ({
            ...p,
            other: { ...p.other, expandedGroups: next },
          }))
        }
      />
    </div>
  )
}
