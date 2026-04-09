import { DAILY_TASKS, OTHER_TASKS, WEEKLY_TASKS } from './tasks'
import type {
  ChecklistCategory,
  ChecklistCounter,
  ChecklistState,
  ChecklistTask,
} from './types'

// Known Baro weekend anchor in UTC. Availability repeats every 14 days.
// Baro arrives Friday 13:00 UTC and leaves Sunday 13:00 UTC.
// Used as fallback when API data is unavailable.
const BARO_ANCHOR_START_UTC = Date.UTC(2026, 2, 20, 13, 0, 0)
const BARO_PERIOD_MS = 14 * 24 * 60 * 60 * 1000
const BARO_ACTIVE_WINDOW_MS = 48 * 60 * 60 * 1000
const EIGHT_HOURS_ANCHOR_UTC = Date.UTC(1970, 0, 1, 8, 0, 0)
const EIGHT_HOURS_PERIOD_MS = 8 * 60 * 60 * 1000

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

/**
 * Baro Ki'Teer availability data sourced from the Oracle world-state API.
 * When provided, these timestamps take priority over the anchor-based fallback.
 */
export type BaroApiData = {
  activationMs: number
  expiryMs: number
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

export function clearExpiredOtherCompletions(
  completed: Record<string, boolean>,
  expired: { eightHours?: boolean; baro?: boolean }
): Record<string, boolean> {
  let result = completed
  if (expired.eightHours) {
    result = clearCompletedByIds(result, OTHER_EIGHT_HOURS_IDS)
  }
  if (expired.baro) {
    result = clearCompletedByIds(result, OTHER_BARO_IDS)
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

export function getBaroPeriodKey(now: Date): string {
  const nowMs = now.getTime()
  if (nowMs < BARO_ANCHOR_START_UTC) {
    return String(BARO_ANCHOR_START_UTC)
  }
  const phaseMs = (nowMs - BARO_ANCHOR_START_UTC) % BARO_PERIOD_MS
  return String(nowMs - phaseMs)
}

export function getTimeUntilNextEightHourReset(date: Date): number {
  const elapsedMs = date.getTime() - EIGHT_HOURS_ANCHOR_UTC
  const phaseMs =
    ((elapsedMs % EIGHT_HOURS_PERIOD_MS) + EIGHT_HOURS_PERIOD_MS) %
    EIGHT_HOURS_PERIOD_MS

  return EIGHT_HOURS_PERIOD_MS - phaseMs
}

export function formatRemainingTime(totalMs: number): string {
  const safeMs = Math.max(0, totalMs)
  const totalSeconds = Math.floor(safeMs / 1000)
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)

  if (days > 0) {
    return `${days}d ${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m`
  }

  return `${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m`
}

export function isBaroKiteerAvailable(
  now: Date,
  baroApi?: BaroApiData
): boolean {
  const nowMs = now.getTime()

  if (baroApi) {
    return nowMs >= baroApi.activationMs && nowMs < baroApi.expiryMs
  }

  if (nowMs < BARO_ANCHOR_START_UTC) {
    return false
  }

  const phaseMs = (nowMs - BARO_ANCHOR_START_UTC) % BARO_PERIOD_MS

  return phaseMs >= 0 && phaseMs < BARO_ACTIVE_WINDOW_MS
}

export function getNextBaroAvailabilityStartUtc(now: Date): Date {
  const nowMs = now.getTime()
  if (nowMs < BARO_ANCHOR_START_UTC) {
    return new Date(BARO_ANCHOR_START_UTC)
  }

  const phaseMs = (nowMs - BARO_ANCHOR_START_UTC) % BARO_PERIOD_MS
  const currentCycleStartMs = nowMs - phaseMs

  if (phaseMs < BARO_ACTIVE_WINDOW_MS) {
    return new Date(currentCycleStartMs)
  }

  return new Date(currentCycleStartMs + BARO_PERIOD_MS)
}

export function getTimeUntilNextBaroChange(
  now: Date,
  baroApi?: BaroApiData
): number {
  const nowMs = now.getTime()

  if (baroApi && baroApi.expiryMs > nowMs) {
    // API data is still relevant (Baro is active or upcoming)
    if (nowMs >= baroApi.activationMs) {
      return baroApi.expiryMs - nowMs
    }
    return baroApi.activationMs - nowMs
  }

  if (nowMs < BARO_ANCHOR_START_UTC) {
    return BARO_ANCHOR_START_UTC - nowMs
  }

  const phaseMs = (nowMs - BARO_ANCHOR_START_UTC) % BARO_PERIOD_MS

  if (phaseMs < BARO_ACTIVE_WINDOW_MS) {
    return BARO_ACTIVE_WINDOW_MS - phaseMs
  }

  return BARO_PERIOD_MS - phaseMs
}

export function getChecklistTaskCounter(
  task: Pick<ChecklistTask, 'resets'>,
  now: Date,
  baroApi?: BaroApiData
): ChecklistCounter | undefined {
  switch (task.resets) {
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
        label: isBaroKiteerAvailable(now, baroApi) ? 'leavesIn' : 'arrivesIn',
        time: formatRemainingTime(getTimeUntilNextBaroChange(now, baroApi)),
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
      eightHoursPeriodKey: getEightHoursPeriodKey(now),
      baroPeriodKey: getBaroPeriodKey(now),
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

  let otherCompleted = sanitizeCompleted(
    parsed.other?.completed,
    VALID_COMPLETED_IDS.other
  )

  if (parsed.other?.eightHoursPeriodKey !== currentEightHoursPeriodKey) {
    otherCompleted = clearCompletedByIds(otherCompleted, OTHER_EIGHT_HOURS_IDS)
  }

  if (parsed.other?.baroPeriodKey !== currentBaroPeriodKey) {
    otherCompleted = clearCompletedByIds(otherCompleted, OTHER_BARO_IDS)
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
      eightHoursPeriodKey: currentEightHoursPeriodKey,
      baroPeriodKey: currentBaroPeriodKey,
      completed: otherCompleted,
      hidden: otherHidden,
      expandedGroups: otherExpandedGroups,
    },
  }
}
