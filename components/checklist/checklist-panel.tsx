'use client'

import { useLocale, useTranslations } from 'next-intl'
import { useCallback, useEffect, useRef, useState } from 'react'
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
import { ChecklistState, ChecklistTask } from '@/lib/types'
import {
  fetchOracleWorldState,
  getVoidTrader,
} from '@/lib/world-state/fetch-world-state'
import { ChecklistSectionCard } from './checklist-section-card'
import { OracleWorldState, VoidTrader } from '@/lib/world-state/types'
import {
  fetchPublicExportMissionTypes,
  fetchPublicExportRegions,
} from '@/lib/public-export/fetch-public-export'
import { Dictionary, getDictionary } from '@/lib/language'
import { PublicExportMap, MissionType, Region } from '@/lib/public-export/types'
import { toTitleCase } from '@/lib/utils'
import {
  type ExternalLabelMap,
  getExternalLabelId,
} from '@/lib/checklist/external-labels'

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

export function ChecklistPanel({
  initialExternalLabels,
}: {
  initialExternalLabels: ExternalLabelMap
}) {
  const locale = useLocale()
  const t = useTranslations()

  const [state, setState] = useState<ChecklistState>(() =>
    createEmptyChecklistState(new Date())
  )
  const [now, setNow] = useState(() => new Date())
  const [baro, setBaro] = useState<VoidTrader | null>(null)
  const [archonRewardLabel, setArchonRewardLabel] = useState<string | null>(
    null
  )
  const [externalLabels] = useState<ExternalLabelMap>(initialExternalLabels)
  const [dictionary, setDictionary] = useState<Dictionary>()
  const [regions, setRegions] = useState<PublicExportMap<Region>>()
  const skipFirstPersistRef = useRef(true)

  function applyDictionaryTitles(tasks: ChecklistTask[]): ChecklistTask[] {
    return tasks.map((task) => {
      let title = task.title
      let prerequisite = task.prerequisite
      let location = task.location
      let terminal = task.terminal
      let npc = task.npc
      let syndicateRank = task.syndicateRank

      if (typeof task.title !== 'string') {
        let resolvedTitle =
          externalLabels[getExternalLabelId(task.title)] ?? task.title.key
        if (resolvedTitle === task.title.key) {
          resolvedTitle = t('ui.loading')
        }
        title = resolvedTitle
      } else {
        title = t(task.title)
      }

      if (task.prerequisite) {
        if (typeof task.prerequisite === 'string') {
          prerequisite = t(task.prerequisite)
        } else {
          let resolvedPrerequisite =
            externalLabels[getExternalLabelId(task.prerequisite)] ??
            task.prerequisite.key
          if (resolvedPrerequisite === task.prerequisite.key) {
            resolvedPrerequisite = t('ui.loading')
          }
          prerequisite = resolvedPrerequisite
        }
      }

      if (task.location) {
        if (Array.isArray(task.location)) {
          const resolvedLocationParts = task.location.map((label) => {
            let resolvedPart =
              externalLabels[getExternalLabelId(label)] ?? label.key
            if (resolvedPart === label.key) {
              resolvedPart = t('ui.loading')
            }
            return resolvedPart
          })
          location = resolvedLocationParts.join(', ')
        } else if (task.location.startsWith('locations.')) {
          location = t(task.location)
        }
      }

      if (task.terminal) {
        if (typeof task.terminal === 'string') {
          terminal = t(task.terminal)
        } else {
          let resolvedTerminal =
            externalLabels[getExternalLabelId(task.terminal)] ??
            task.terminal.key
          if (resolvedTerminal === task.terminal.key) {
            resolvedTerminal = t('ui.loading')
          }
          terminal = resolvedTerminal
        }
      }

      if (task.npc) {
        if (typeof task.npc === 'string') {
          npc = t(task.npc)
        } else {
          let resolvedNpc =
            externalLabels[getExternalLabelId(task.npc)] ?? task.npc.key
          if (resolvedNpc === task.npc.key) {
            resolvedNpc = t('ui.loading')
          }
          npc = resolvedNpc
        }
      }

      if (task.syndicateRank) {
        if (typeof task.syndicateRank.syndicate === 'string') {
          syndicateRank = {
            ...task.syndicateRank,
            syndicate: t(task.syndicateRank.syndicate),
          }
        } else {
          let resolvedSyndicate =
            externalLabels[getExternalLabelId(task.syndicateRank.syndicate)] ??
            task.syndicateRank.syndicate.key
          if (resolvedSyndicate === task.syndicateRank.syndicate.key) {
            resolvedSyndicate = t('ui.loading')
          }
          syndicateRank = {
            ...task.syndicateRank,
            syndicate: resolvedSyndicate,
          }
        }
      }

      const subitems = task.subitems
        ? applyDictionaryTitles(task.subitems)
        : undefined

      return {
        ...task,
        title,
        prerequisite,
        location,
        terminal,
        npc,
        syndicateRank,
        subitems,
      }
    })
  }

  const getArchonRewardLabel = useCallback(
    (
      worldState: OracleWorldState,
      missionTypes: PublicExportMap<MissionType>,
      dictionary: Dictionary
    ): string | null => {
      const sorties = worldState.LiteSorties ?? []
      if (sorties.length === 0) {
        return null
      }

      const sortie = sorties[0]

      const bossName = toTitleCase(sortie.Boss.substring(12)) // remove "SORTIE_BOSS_"

      const missions = sortie.Missions.map((mission) => {
        const missionType = missionTypes[mission.missionType]
        const missionTypeName = missionType?.name
        const localizedMissionType =
          missionTypeName != null ? dictionary[missionTypeName] : undefined

        if (typeof localizedMissionType === 'string' && localizedMissionType) {
          return toTitleCase(localizedMissionType)
        }

        return mission.missionType
      }).join(', ')

      const reward = `${bossName} (${missions})`
      if (!reward) {
        return null
      }

      return reward
    },
    []
  )

  const getTeshinRewardLabel = useCallback(() => {
    const EPOCH = 1736121600 * 1000
    const week = Math.trunc((now.getTime() - EPOCH) / 604800000)

    const reward = [
      'umbraForma',
      'kuva',
      'kitgunRiven',
      'forma',
      'zawRiven',
      'endo',
      'rifleRiven',
      'shotgunRiven',
    ][week % 8]

    return `${t('rewards')}: ${t(`teshinOffers.${reward}`)}`
  }, [t, now])

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
        const nextEightHours = getEightHoursPeriodKey(current)
        const nextBaro = getBaroPeriodKey(current)

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

        const eightHoursExpired =
          nextState.other.eightHoursPeriodKey !== nextEightHours
        const baroExpired = nextState.other.baroPeriodKey !== nextBaro

        if (eightHoursExpired || baroExpired) {
          nextState = {
            ...nextState,
            other: {
              ...nextState.other,
              eightHoursPeriodKey: nextEightHours,
              baroPeriodKey: nextBaro,
              completed: clearExpiredOtherCompletions(
                nextState.other.completed,
                { eightHours: eightHoursExpired, baro: baroExpired }
              ),
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
        const missionTypes = await fetchPublicExportMissionTypes()
        const regions = await fetchPublicExportRegions()
        const dict = await getDictionary(locale)

        if (!isCancelled) {
          setBaro(getVoidTrader(worldState))
          setArchonRewardLabel(
            getArchonRewardLabel(worldState, missionTypes, dict)
          )
          setDictionary(dict)
          setRegions(regions)
        }
      } catch {
        if (!isCancelled) {
          setBaro(null)
          setArchonRewardLabel(null)
          setDictionary(undefined)
          setRegions(undefined)
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
  }, [getArchonRewardLabel, locale])

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
  const dailyTasks: ChecklistTask[] = applyDictionaryTitles(
    CHECKLIST_TASKS.daily
  )
  const weeklyTasks: ChecklistTask[] = applyDictionaryTitles(
    CHECKLIST_TASKS.weekly.map((task) => {
      if (task.id === 'weekly-archon-hunt') {
        return {
          ...task,
          dynamicInfo: archonRewardLabel ?? undefined,
        }
      }

      if (task.id === 'weekly-vendors' && task.subitems) {
        return {
          ...task,
          subitems: task.subitems.map((subitem) =>
            subitem.id === 'weekly-vendor-teshin'
              ? {
                  ...subitem,
                  dynamicInfo: getTeshinRewardLabel(),
                }
              : subitem
          ),
        }
      }

      return task
    })
  )

  const otherTasks: ChecklistTask[] = applyDictionaryTitles(
    (() => {
      const base = CHECKLIST_TASKS.other.filter(
        (task) => task.id !== 'other-baro'
      )

      const baroTaskTemplate = CHECKLIST_TASKS.other.find(
        (task) => task.id === 'other-baro'
      ) as ChecklistTask

      let resolvedBaroLocation = t('checklist.other.relayLocationPending')
      if (baro?.Node && regions && dictionary) {
        const region = regions[baro.Node]

        if (region) {
          const regionName = dictionary[region.name]
          const systemName = dictionary[region.systemName]

          resolvedBaroLocation =
            regionName && systemName
              ? `${regionName}, ${systemName}`
              : baro.Node
        } else {
          resolvedBaroLocation = baro.Node
        }
      }

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
  )

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
