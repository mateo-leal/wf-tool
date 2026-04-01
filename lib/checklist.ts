import { DAILY_TASKS, OTHER_TASKS, WEEKLY_TASKS } from './tasks'
import type { ChecklistCategory, ChecklistState, ChecklistTask } from './types'

// Known Baro weekend anchor in UTC. Availability repeats every 14 days.
// Baro arrives Friday 13:00 UTC and leaves Sunday 13:00 UTC.
const BARO_ANCHOR_START_UTC = Date.UTC(2026, 2, 20, 13, 0, 0)
const BARO_PERIOD_MS = 14 * 24 * 60 * 60 * 1000
const BARO_ACTIVE_WINDOW_MS = 48 * 60 * 60 * 1000

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

const VALID_IDS = {
  daily: new Set(collectCheckableTaskIds(DAILY_TASKS)),
  weekly: new Set(collectCheckableTaskIds(WEEKLY_TASKS)),
  other: new Set(collectCheckableTaskIds(OTHER_TASKS)),
}

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
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

export function isBaroKiteerAvailable(now: Date): boolean {
  const nowMs = now.getTime()
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

export function getTimeUntilNextBaroChange(now: Date): number {
  const nowMs = now.getTime()

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
  now: Date
): { label: 'resetsIn' | 'arrivesIn' | 'leavesIn'; time: string } | undefined {
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
    case 'baro': {
      return {
        label: isBaroKiteerAvailable(now) ? 'leavesIn' : 'arrivesIn',
        time: formatRemainingTime(getTimeUntilNextBaroChange(now)),
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
    },
    weekly: {
      periodKey: getWeeklyResetKey(now),
      completed: {},
    },
    other: {
      completed: {},
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
      ? sanitizeCompleted(parsed.daily?.completed, VALID_IDS.daily)
      : {}

  const weeklyCompleted =
    parsed.weekly?.periodKey === weeklyKey
      ? sanitizeCompleted(parsed.weekly?.completed, VALID_IDS.weekly)
      : {}

  const otherCompleted = sanitizeCompleted(
    parsed.other?.completed,
    VALID_IDS.other
  )

  return {
    daily: {
      periodKey: dailyKey,
      completed: dailyCompleted,
    },
    weekly: {
      periodKey: weeklyKey,
      completed: weeklyCompleted,
    },
    other: {
      completed: otherCompleted,
    },
  }
}
