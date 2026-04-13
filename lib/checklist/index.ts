import { DAILY_TASKS, OTHER_TASKS, WEEKLY_TASKS } from './tasks'
import type {
  ChecklistCategory,
  ChecklistCounter,
  ChecklistState,
  ChecklistTask,
  Counter,
} from '../types'
import {
  getBaroPeriodKey,
  getTimeUntilNextBaroChange,
  isBaroKiteerAvailable,
} from '../world-state/baro'
import { OracleWorldState } from '../world-state/types'

const EIGHT_HOURS_ANCHOR_UTC = Date.UTC(1970, 0, 1, 8, 0, 0)
const EIGHT_HOURS_PERIOD_MS = 8 * 60 * 60 * 1000
const HOURLY_PERIOD_MS = 60 * 60 * 1000

const SORTIE_RESET_HOUR_UTC = Date.UTC(1970, 0, 1, 16, 0, 0)
const SORTIE_PERIOD_MS = 24 * 60 * 60 * 1000

export type StoredChecklistState = Partial<{
  daily: Partial<ChecklistState['daily']>
  weekly: Partial<ChecklistState['weekly']>
  other: Partial<ChecklistState['other']>
}>

export const CHECKLIST_TASKS: Record<ChecklistCategory, ChecklistTask[]> = {
  daily: DAILY_TASKS,
  weekly: WEEKLY_TASKS,
  other: OTHER_TASKS,
}

const DEFAULT_EXPANDED_GROUP_IDS: Record<ChecklistCategory, string[]> = {
  daily: ['daily-world-syndicates', 'daily-vendors'],
  weekly: ['weekly-search-pulses', 'weekly-vendors'],
  other: [],
}

function createDefaultExpandedGroups(
  section: ChecklistCategory
): Record<string, boolean> {
  return Object.fromEntries(
    DEFAULT_EXPANDED_GROUP_IDS[section].map((id) => [id, true])
  )
}

function collectTaskIds(tasks: ChecklistTask[]): string[] {
  return tasks.flatMap((task) => {
    const childIds = task.subitems ? collectTaskIds(task.subitems) : []

    return [task.id, ...childIds]
  })
}

/**
 * Recursively collects IDs of checkable tasks and subitems.
 * @param tasks List of tasks to process
 * @returns Array of checkable task IDs
 */
function collectCheckableTaskIds(tasks: ChecklistTask[]): string[] {
  return tasks.flatMap((task) => {
    const childIds = task.subitems ? collectCheckableTaskIds(task.subitems) : []

    const isGroup = Boolean(task.subitems && task.subitems.length > 0)
    const isCheckable =
      task.checkable === true || (!isGroup && task.checkable !== false)

    if (!isCheckable) {
      return childIds
    }

    return [task.id, ...childIds]
  })
}

const VALID_COMPLETED_IDS = {
  daily: new Set(collectCheckableTaskIds(DAILY_TASKS)),
  weekly: new Set(collectCheckableTaskIds(WEEKLY_TASKS)),
  other: new Set(collectCheckableTaskIds(OTHER_TASKS)),
}

const VALID_HIDDEN_IDS = {
  daily: new Set(collectTaskIds(DAILY_TASKS)),
  weekly: new Set(collectTaskIds(WEEKLY_TASKS)),
  other: new Set(collectTaskIds(OTHER_TASKS)),
}

const VALID_EXPANDED_GROUP_IDS = {
  daily: new Set(
    DAILY_TASKS.filter((task) => task.subitems?.length).map((task) => task.id)
  ),
  weekly: new Set(
    WEEKLY_TASKS.filter((task) => task.subitems?.length).map((task) => task.id)
  ),
  other: new Set(
    OTHER_TASKS.filter((task) => task.subitems?.length).map((task) => task.id)
  ),
}

function collectIdsByReset(
  tasks: ChecklistTask[],
  reset: ChecklistTask['resets']
): Set<string> {
  return new Set(
    tasks.flatMap((task) => {
      const childIds = task.subitems
        ? [...collectIdsByReset(task.subitems, reset)]
        : []
      return task.resets === reset ? [task.id, ...childIds] : childIds
    })
  )
}

function clearCompletedByIds(
  completed: Record<string, boolean>,
  ids: Set<string>
): Record<string, boolean> {
  return Object.fromEntries(
    Object.entries(completed).filter(([id]) => !ids.has(id))
  )
}

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

const OTHER_EIGHT_HOURS_IDS = collectIdsByReset(OTHER_TASKS, 'eightHours')
const OTHER_BARO_IDS = collectIdsByReset(OTHER_TASKS, 'baro')
const OTHER_HOURLY_IDS = collectIdsByReset(OTHER_TASKS, 'hourly')
const OTHER_SORTIE_IDS = collectIdsByReset(OTHER_TASKS, 'sortie')

export function clearExpiredOtherCompletions(
  completed: Record<string, boolean>,
  expired: {
    hourly?: boolean
    eightHours?: boolean
    baro?: boolean
    sortie?: boolean
  }
): Record<string, boolean> {
  let result = completed
  if (expired.hourly) {
    result = clearCompletedByIds(result, OTHER_HOURLY_IDS)
  }
  if (expired.eightHours) {
    result = clearCompletedByIds(result, OTHER_EIGHT_HOURS_IDS)
  }
  if (expired.baro) {
    result = clearCompletedByIds(result, OTHER_BARO_IDS)
  }
  if (expired.sortie) {
    result = clearCompletedByIds(result, OTHER_SORTIE_IDS)
  }
  return result
}

function toUTCDateKey(date: Date): string {
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getStartOfUTCWeek(date: Date): Date {
  const start = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  )
  const dayOffset = (start.getUTCDay() + 6) % 7
  start.setUTCDate(start.getUTCDate() - dayOffset)
  return start
}

/**
 * Sanitizes the completed tasks object by filtering out invalid IDs and ensuring boolean values.
 * @param value The raw completed tasks object
 * @param validIds Set of valid task IDs
 * @returns Sanitized completed tasks object
 */
function sanitizeCompleted(
  value: unknown,
  validIds: Set<string>
): Record<string, boolean> {
  if (!isObject(value)) {
    return {}
  }

  return Object.fromEntries(
    Object.entries(value)
      .filter(([id]) => validIds.has(id))
      .map(([id, checked]) => [id, Boolean(checked)])
      .filter(([, checked]) => checked)
  )
}

function sanitizeHidden(
  value: unknown,
  validIds: Set<string>
): Record<string, boolean> {
  if (!isObject(value)) {
    return {}
  }

  return Object.fromEntries(
    Object.entries(value)
      .filter(([id]) => validIds.has(id))
      .map(([id, hidden]) => [id, Boolean(hidden)])
      .filter(([, hidden]) => hidden)
  )
}

function sanitizeExpandedGroups(
  value: unknown,
  validIds: Set<string>,
  defaults: Record<string, boolean>
): Record<string, boolean> {
  if (!isObject(value)) {
    return defaults
  }

  return {
    ...defaults,
    ...Object.fromEntries(
      Object.entries(value)
        .filter(([id]) => validIds.has(id))
        .map(([id, expanded]) => [id, Boolean(expanded)])
    ),
  }
}

export function getDailyResetKey(date: Date): string {
  return toUTCDateKey(date)
}

export function getWeeklyResetKey(date: Date): string {
  return toUTCDateKey(getStartOfUTCWeek(date))
}

export function getTimeUntilNextUtcDay(date: Date): number {
  const next = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + 1)
  )
  return Math.max(0, next.getTime() - date.getTime())
}

export function getTimeUntilNextUtcWeek(date: Date): number {
  const start = getStartOfUTCWeek(date)
  const next = new Date(start)
  next.setUTCDate(start.getUTCDate() + 7)
  return Math.max(0, next.getTime() - date.getTime())
}

export function getEightHoursPeriodKey(now: Date): string {
  const elapsedMs = now.getTime() - EIGHT_HOURS_ANCHOR_UTC
  const phaseMs =
    ((elapsedMs % EIGHT_HOURS_PERIOD_MS) + EIGHT_HOURS_PERIOD_MS) %
    EIGHT_HOURS_PERIOD_MS
  return String(now.getTime() - phaseMs)
}

export function getHourlyPeriodKey(now: Date): string {
  const nowMs = now.getTime()
  const phaseMs =
    ((nowMs % HOURLY_PERIOD_MS) + HOURLY_PERIOD_MS) % HOURLY_PERIOD_MS
  return String(nowMs - phaseMs)
}

export function getTimeUntilNextHourlyReset(date: Date): number {
  const nowMs = date.getTime()
  const phaseMs =
    ((nowMs % HOURLY_PERIOD_MS) + HOURLY_PERIOD_MS) % HOURLY_PERIOD_MS
  return HOURLY_PERIOD_MS - phaseMs
}

export function getTimeUntilNextEightHourReset(date: Date): number {
  const elapsedMs = date.getTime() - EIGHT_HOURS_ANCHOR_UTC
  const phaseMs =
    ((elapsedMs % EIGHT_HOURS_PERIOD_MS) + EIGHT_HOURS_PERIOD_MS) %
    EIGHT_HOURS_PERIOD_MS

  return EIGHT_HOURS_PERIOD_MS - phaseMs
}

export function getSortiePeriodKey(now: Date): string {
  const elapsedMs = now.getTime() - SORTIE_RESET_HOUR_UTC
  const phaseMs =
    ((elapsedMs % SORTIE_PERIOD_MS) + SORTIE_PERIOD_MS) % SORTIE_PERIOD_MS
  return String(now.getTime() - phaseMs)
}

function getTimeUntilNextSortieReset(
  date: Date,
  worldState?: OracleWorldState
) {
  const nowMs = date.getTime()
  const sortie = worldState?.Sorties?.[0]

  if (sortie) {
    const sortieTimes = {
      expiryMs: Number(sortie.Expiry.$date.$numberLong),
      activationMs: Number(sortie.Activation.$date.$numberLong),
    }
    if (sortieTimes.expiryMs > nowMs) {
      // API data is still relevant (Sortie is active or upcoming)
      if (nowMs >= sortieTimes.activationMs) {
        return sortieTimes.expiryMs - nowMs
      }
      return sortieTimes.activationMs - nowMs
    }
  }

  // Fallback to 24h reset, starting at 4 PM UTC
  const elapsedMs = nowMs - SORTIE_RESET_HOUR_UTC
  const phaseMs =
    ((elapsedMs % SORTIE_PERIOD_MS) + SORTIE_PERIOD_MS) % SORTIE_PERIOD_MS

  return SORTIE_PERIOD_MS - phaseMs
}

export function formatRemainingTime(totalMs: number): Counter {
  const safeMs = Math.max(0, totalMs)
  const totalSeconds = Math.floor(safeMs / 1000)
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  return {
    days,
    hours,
    minutes,
    seconds,
  }
}

export function getChecklistTaskCounter(
  task: Pick<ChecklistTask, 'resets'>,
  now: Date,
  worldState?: OracleWorldState
): ChecklistCounter | undefined {
  switch (task.resets) {
    case 'hourly':
      return {
        label: 'resetsIn',
        time: formatRemainingTime(getTimeUntilNextHourlyReset(now)),
      }
    case 'daily':
      return {
        label: 'resetsIn',
        time: formatRemainingTime(getTimeUntilNextUtcDay(now)),
      }
    case 'weekly':
      return {
        label: 'resetsIn',
        time: formatRemainingTime(getTimeUntilNextUtcWeek(now)),
      }
    case 'eightHours':
      return {
        label: 'resetsIn',
        time: formatRemainingTime(getTimeUntilNextEightHourReset(now)),
      }
    case 'baro': {
      return {
        label: isBaroKiteerAvailable(now, worldState)
          ? 'leavesIn'
          : 'arrivesIn',
        time: formatRemainingTime(getTimeUntilNextBaroChange(now, worldState)),
      }
    }
    case 'sortie': {
      return {
        label: 'resetsIn',
        time: formatRemainingTime(getTimeUntilNextSortieReset(now, worldState)),
      }
    }
    default:
      return undefined
  }
}

export function createEmptyChecklistState(now: Date): ChecklistState {
  return {
    daily: {
      periodKey: getDailyResetKey(now),
      completed: {},
      hidden: {},
      expandedGroups: createDefaultExpandedGroups('daily'),
    },
    weekly: {
      periodKey: getWeeklyResetKey(now),
      completed: {},
      hidden: {},
      expandedGroups: createDefaultExpandedGroups('weekly'),
    },
    other: {
      hourlyPeriodKey: getHourlyPeriodKey(now),
      eightHoursPeriodKey: getEightHoursPeriodKey(now),
      baroPeriodKey: getBaroPeriodKey(now),
      sortiePeriodKey: getSortiePeriodKey(now),
      completed: {},
      hidden: {},
      expandedGroups: createDefaultExpandedGroups('other'),
    },
  }
}

export function normalizeChecklistState(
  raw: unknown,
  now: Date
): ChecklistState {
  const empty = createEmptyChecklistState(now)
  if (!isObject(raw)) {
    return empty
  }

  const parsed = raw as StoredChecklistState
  const dailyKey = getDailyResetKey(now)
  const weeklyKey = getWeeklyResetKey(now)

  const dailyCompleted =
    parsed.daily?.periodKey === dailyKey
      ? sanitizeCompleted(parsed.daily?.completed, VALID_COMPLETED_IDS.daily)
      : {}

  const weeklyCompleted =
    parsed.weekly?.periodKey === weeklyKey
      ? sanitizeCompleted(parsed.weekly?.completed, VALID_COMPLETED_IDS.weekly)
      : {}

  const dailyHidden = sanitizeHidden(
    parsed.daily?.hidden,
    VALID_HIDDEN_IDS.daily
  )
  const dailyExpandedGroups = sanitizeExpandedGroups(
    parsed.daily?.expandedGroups,
    VALID_EXPANDED_GROUP_IDS.daily,
    createDefaultExpandedGroups('daily')
  )

  const weeklyHidden = sanitizeHidden(
    parsed.weekly?.hidden,
    VALID_HIDDEN_IDS.weekly
  )
  const weeklyExpandedGroups = sanitizeExpandedGroups(
    parsed.weekly?.expandedGroups,
    VALID_EXPANDED_GROUP_IDS.weekly,
    createDefaultExpandedGroups('weekly')
  )

  const currentEightHoursPeriodKey = getEightHoursPeriodKey(now)
  const currentBaroPeriodKey = getBaroPeriodKey(now)
  const currentSortiePeriodKey = getSortiePeriodKey(now)
  const currentHourlyPeriodKey = getHourlyPeriodKey(now)

  let otherCompleted = sanitizeCompleted(
    parsed.other?.completed,
    VALID_COMPLETED_IDS.other
  )

  if (parsed.other?.hourlyPeriodKey !== currentHourlyPeriodKey) {
    otherCompleted = clearCompletedByIds(otherCompleted, OTHER_HOURLY_IDS)
  }

  if (parsed.other?.eightHoursPeriodKey !== currentEightHoursPeriodKey) {
    otherCompleted = clearCompletedByIds(otherCompleted, OTHER_EIGHT_HOURS_IDS)
  }

  if (parsed.other?.baroPeriodKey !== currentBaroPeriodKey) {
    otherCompleted = clearCompletedByIds(otherCompleted, OTHER_BARO_IDS)
  }

  if (parsed.other?.sortiePeriodKey !== currentSortiePeriodKey) {
    otherCompleted = clearCompletedByIds(otherCompleted, OTHER_SORTIE_IDS)
  }

  const otherHidden = sanitizeHidden(
    parsed.other?.hidden,
    VALID_HIDDEN_IDS.other
  )
  const otherExpandedGroups = sanitizeExpandedGroups(
    parsed.other?.expandedGroups,
    VALID_EXPANDED_GROUP_IDS.other,
    createDefaultExpandedGroups('other')
  )

  return {
    daily: {
      periodKey: dailyKey,
      completed: dailyCompleted,
      hidden: dailyHidden,
      expandedGroups: dailyExpandedGroups,
    },
    weekly: {
      periodKey: weeklyKey,
      completed: weeklyCompleted,
      hidden: weeklyHidden,
      expandedGroups: weeklyExpandedGroups,
    },
    other: {
      hourlyPeriodKey: currentHourlyPeriodKey,
      eightHoursPeriodKey: currentEightHoursPeriodKey,
      baroPeriodKey: currentBaroPeriodKey,
      sortiePeriodKey: currentSortiePeriodKey,
      completed: otherCompleted,
      hidden: otherHidden,
      expandedGroups: otherExpandedGroups,
    },
  }
}
