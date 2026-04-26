'use client'

import { useTranslations } from 'next-intl'
import { Faction, MissionType, Region } from '@tenno-companion/core/types'
import { useCallback, useEffect, useRef, useState, useMemo } from 'react'

import {
  CHECKLIST_TASKS,
  clearExpiredOtherCompletions,
  createEmptyChecklistState,
  formatRemainingTime,
  getDailyResetKey,
  getEightHoursPeriodKey,
  getHourlyPeriodKey,
  getSortiePeriodKey,
  getTimeUntilNextUtcDay,
  getTimeUntilNextUtcWeek,
  getWeeklyResetKey,
  normalizeChecklistState,
} from '@/lib/checklist'
import {
  ChecklistCategory,
  ChecklistState,
  ChecklistTask,
  LabelExternal,
} from '@/lib/checklist/types'
import {
  getBaro,
  getBaroPeriodKey,
  isBaroKiteerAvailable,
} from '@/lib/world-state/baro'
import { CHECKLIST_STORAGE_KEY } from '@/lib/storage-keys'
import { counterToString, toTitleCase } from '@/lib/utils'
import { getSortieBossName } from '@/lib/checklist/sortie-bosses'

import { useGameData } from '../providers/game-data'
import { ChecklistSectionCard } from './checklist-section-card'
import { DUVIRI_FRAMES, DUVIRI_WEAPONS } from './duviri-choices'

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

type Props = {
  factions: Faction[]
  missionTypes: MissionType[]
  regions: Region[]
}

export function ChecklistPanel({ factions, missionTypes, regions }: Props) {
  const t = useTranslations()
  const { worldState, arbitrations, dictionaries, fetchDictionary } =
    useGameData()

  const [state, setState] = useState<ChecklistState>(() =>
    createEmptyChecklistState(new Date())
  )
  const [now, setNow] = useState(() => new Date())
  const skipFirstPersistRef = useRef(true)

  useEffect(() => {
    void fetchDictionary('default')
    void fetchDictionary('oracle')
  }, [fetchDictionary])

  useEffect(() => {
    setState(loadChecklistState(new Date()))
    const interval = window.setInterval(() => {
      const current = new Date()
      setNow(current)
      setState((prev) => {
        const nextDaily = getDailyResetKey(current)
        const nextWeekly = getWeeklyResetKey(current)
        const nextHourly = getHourlyPeriodKey(current)
        const nextEightHours = getEightHoursPeriodKey(current)
        const nextSortie = getSortiePeriodKey(current)
        const nextBaro = getBaroPeriodKey(current)

        const next = { ...prev }
        if (prev.daily.periodKey !== nextDaily) {
          next.daily = { ...next.daily, periodKey: nextDaily, completed: {} }
        }
        if (prev.weekly.periodKey !== nextWeekly) {
          next.weekly = { ...next.weekly, periodKey: nextWeekly, completed: {} }
        }

        const hourlyExpired = next.other.hourlyPeriodKey !== nextHourly
        const eightHoursExpired =
          next.other.eightHoursPeriodKey !== nextEightHours
        const baroExpired = next.other.baroPeriodKey !== nextBaro
        const sortieExpired = next.other.sortiePeriodKey !== nextSortie

        const hasPeriodChange =
          prev.daily.periodKey !== nextDaily ||
          prev.weekly.periodKey !== nextWeekly ||
          hourlyExpired ||
          eightHoursExpired ||
          baroExpired ||
          sortieExpired

        if (!hasPeriodChange) {
          return prev
        }

        if (
          hourlyExpired ||
          eightHoursExpired ||
          baroExpired ||
          sortieExpired
        ) {
          next.other = {
            ...next.other,
            hourlyPeriodKey: nextHourly,
            eightHoursPeriodKey: nextEightHours,
            baroPeriodKey: nextBaro,
            sortiePeriodKey: nextSortie,
            completed: clearExpiredOtherCompletions(next.other.completed, {
              hourly: hourlyExpired,
              eightHours: eightHoursExpired,
              baro: baroExpired,
              sortie: sortieExpired,
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
      return tasks.map((task) => {
        const resolve = (
          obj: string | LabelExternal | undefined
        ): string | undefined => {
          if (!obj) return undefined
          if (typeof obj === 'string') return t(obj)
          const dict = dictionaries[obj.source || 'default'] || {}
          let label = dict[obj.key]
          if (obj.format === 'titleCase' && label) {
            label = toTitleCase(label)
          }
          return label ?? t('ui.loading')
        }

        const resolveLocation = (
          loc: string | LabelExternal[] | undefined
        ): string | undefined => {
          if (!loc) return undefined
          if (Array.isArray(loc)) {
            return loc
              .map((l) => {
                const dict = dictionaries[l.source || 'default'] || {}
                let label = dict[l.key]
                if (l.format === 'titleCase' && label) {
                  label = toTitleCase(label)
                }
                return label ?? t('ui.loading')
              })
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
    if (!sortie) return null

    const boss = toTitleCase(sortie.Boss.replace('SORTIE_BOSS_', ''))
    const missions = sortie.Missions.map((m) => {
      const missionTypeName = missionTypes.find(
        (mt) => mt.uniqueName === m.missionType
      )?.name
      return missionTypeName ? toTitleCase(missionTypeName) : m.missionType
    }).join(', ')

    return `${boss} (${missions})`
  }, [worldState?.LiteSorties, missionTypes])

  const duviriRewardLabel = useMemo(() => {
    const endlessXpChoice = worldState?.EndlessXpChoices.find(
      (exc) => exc.Category === 'EXC_NORMAL'
    )

    if (!endlessXpChoice) return null

    return endlessXpChoice.Choices.map((choice) => {
      const key = DUVIRI_FRAMES[choice.toLowerCase()]
      if (key) {
        return dictionaries.default?.[key] ?? choice
      }
      return choice
    }).join(' - ')
  }, [dictionaries.default, worldState?.EndlessXpChoices])

  const duviriSteelPathRewardLabel = useMemo(() => {
    const endlessXpChoice = worldState?.EndlessXpChoices.find(
      (exc) => exc.Category === 'EXC_HARD'
    )

    if (!endlessXpChoice) return null

    return endlessXpChoice.Choices.map((choice) => {
      const key = DUVIRI_WEAPONS[choice.toLowerCase()]
      if (key) {
        return dictionaries.default?.[key] ?? choice
      }
      return choice
    }).join(' - ')
  }, [dictionaries.default, worldState?.EndlessXpChoices])

  const arbitrationLabels = useMemo(() => {
    if (arbitrations) {
      const currentHour = Math.trunc(now.getTime() / 3_600_000) * 3600
      const epochHour = arbitrations[0].timestamp
      const currentHourIndex = (currentHour - epochHour) / 3600
      const currentArbitration = arbitrations[currentHourIndex]

      const region = regions.find(
        (r) => r.uniqueName === currentArbitration.node
      )

      if (region) {
        let rewardLabel = toTitleCase(region.missionName)
        if (region.faction) {
          const faction = factions.find((f) => f.uniqueName === region.faction)
          if (faction && faction.name) {
            rewardLabel = `${toTitleCase(region.missionName)} (${faction.name})`
          }
        }
        return {
          dynamicInfo: rewardLabel,
          location: `${region.name}, ${region.systemName}`,
        }
      }
    }
  }, [arbitrations, factions, now, regions])

  const sortieRewardLabel = useMemo(() => {
    const sortie = worldState?.Sorties?.[0]
    const dict = dictionaries.default
    if (!sortie || !dict) return null

    // TODO: Migrate this to core
    const boss = getSortieBossName(sortie.Boss, dict)
    const missions = sortie.Variants.map((variant, index) => {
      let missionName = missionTypes.find(
        (mt) => mt.uniqueName === variant.missionType
      )?.name
      missionName = missionName ? toTitleCase(missionName) : variant.missionType
      const modifier = variant.modifierType
        ? `${t(`sortieModifiers.${variant.modifierType}`)}`
        : ''
      return (
        <li key={`${index}-${variant.missionType}`}>
          {missionName} - {modifier}
        </li>
      )
    })

    return (
      <>
        <span>{boss}</span>
        <ul className="list-disc list-inside">{missions}</ul>
      </>
    )
  }, [worldState?.Sorties, dictionaries.default, missionTypes, t])

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

  const baro = getBaro(worldState)
  const isBaroAvailable = isBaroKiteerAvailable(now, worldState)

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
          if (task.id === 'weekly-circuit-normal') {
            return { ...task, dynamicInfo: duviriRewardLabel ?? undefined }
          }
          if (task.id === 'weekly-circuit-sp') {
            return {
              ...task,
              dynamicInfo: duviriSteelPathRewardLabel ?? undefined,
            }
          }
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
    [
      applyDictionaryTitles,
      archonRewardLabel,
      duviriRewardLabel,
      duviriSteelPathRewardLabel,
      teshinRewardLabel,
    ]
  )

  const otherTasks = useMemo(
    () =>
      applyDictionaryTitles(
        CHECKLIST_TASKS.other.map((task) => {
          if (task.id === 'other-baro') {
            let baroLocation = t('checklist.other.relayLocationPending')
            const region = baro?.Node
              ? regions.find((r) => r.uniqueName === baro.Node)
              : undefined

            if (region) {
              baroLocation =
                region.name && region.systemName
                  ? `${region.name}, ${region.systemName}`
                  : baro!.Node
            } else if (baro?.Node) {
              baroLocation = baro.Node
            }
            return {
              ...task,
              location: baroLocation,
              checkable: isBaroAvailable,
            }
          }

          if (task.id === 'other-arbitration') {
            return { ...task, ...arbitrationLabels }
          }

          if (task.id === 'other-sortie') {
            return { ...task, dynamicInfo: sortieRewardLabel ?? undefined }
          }
          return task
        })
      ),
    [
      applyDictionaryTitles,
      arbitrationLabels,
      baro,
      isBaroAvailable,
      regions,
      sortieRewardLabel,
      t,
    ]
  )

  const toggleTask = (section: ChecklistCategory, id: string) => {
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
  const toggleHidden = (s: ChecklistCategory, id: string) => {
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
          time: counterToString(
            formatRemainingTime(getTimeUntilNextUtcDay(now)),
            t,
            { showSeconds: false }
          ),
        })}
        tasks={dailyTasks}
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
          time: counterToString(
            formatRemainingTime(getTimeUntilNextUtcWeek(now)),
            t,
            { showSeconds: false }
          ),
        })}
        tasks={weeklyTasks}
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
        completed={state.other.completed}
        hidden={state.other.hidden}
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
