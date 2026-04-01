import {
  createEmptyChecklistState,
  formatRemainingTime,
  getNextBaroAvailabilityStartUtc,
  getDailyResetKey,
  getTimeUntilNextUtcDay,
  getTimeUntilNextUtcWeek,
  getWeeklyResetKey,
  isBaroKiteerAvailable,
  normalizeChecklistState,
} from '../checklist'

describe('checklist reset utilities', () => {
  it('computes daily reset key in UTC', () => {
    const date = new Date('2026-03-25T23:59:59.000Z')
    expect(getDailyResetKey(date)).toBe('2026-03-25')

    const next = new Date('2026-03-26T00:00:00.000Z')
    expect(getDailyResetKey(next)).toBe('2026-03-26')
  })

  it('computes weekly reset key as UTC monday', () => {
    const wednesday = new Date('2026-03-25T14:00:00.000Z')
    expect(getWeeklyResetKey(wednesday)).toBe('2026-03-23')

    const monday = new Date('2026-03-30T00:00:00.000Z')
    expect(getWeeklyResetKey(monday)).toBe('2026-03-30')

    const sunday = new Date('2026-03-29T23:59:59.000Z')
    expect(getWeeklyResetKey(sunday)).toBe('2026-03-23')
  })

  it('returns positive time to next UTC day reset', () => {
    const date = new Date('2026-03-25T23:00:00.000Z')
    expect(getTimeUntilNextUtcDay(date)).toBe(60 * 60 * 1000)
  })

  it('returns positive time to next UTC monday reset', () => {
    const date = new Date('2026-03-29T12:00:00.000Z')
    expect(getTimeUntilNextUtcWeek(date)).toBe(12 * 60 * 60 * 1000)
  })

  it('drops stale daily and weekly completions when periods change', () => {
    const now = new Date('2026-03-30T12:00:00.000Z')
    const normalized = normalizeChecklistState(
      {
        daily: {
          periodKey: '2026-03-29',
          completed: {
            'daily-login-reward': true,
          },
        },
        weekly: {
          periodKey: '2026-03-23',
          completed: {
            'weekly-nightwave': true,
          },
        },
        other: {
          completed: {
            'other-baro': true,
          },
        },
      },
      now
    )

    expect(normalized.daily.completed).toEqual({})
    expect(normalized.weekly.completed).toEqual({})
    expect(normalized.other.completed).toEqual({
      'other-baro': true,
    })
  })

  it('keeps in-period daily and weekly completions', () => {
    const now = new Date('2026-03-30T12:00:00.000Z')
    const current = createEmptyChecklistState(now)

    const normalized = normalizeChecklistState(
      {
        daily: {
          periodKey: current.daily.periodKey,
          completed: {
            'daily-login-reward': true,
          },
        },
        weekly: {
          periodKey: current.weekly.periodKey,
          completed: {
            'weekly-nightwave': true,
          },
        },
      },
      now
    )

    expect(normalized.daily.completed).toEqual({
      'daily-login-reward': true,
    })
    expect(normalized.weekly.completed).toEqual({
      'weekly-nightwave': true,
    })
  })

  it('formats remaining time with day values', () => {
    const text = formatRemainingTime(2 * 24 * 60 * 60 * 1000 + 75 * 60 * 1000)
    expect(text).toBe('2d 01h 15m')
  })

  it('shows Baro on anchor weekend Friday through Sunday', () => {
    expect(isBaroKiteerAvailable(new Date('2026-03-20T13:00:00.000Z'))).toBe(
      true
    )
    expect(isBaroKiteerAvailable(new Date('2026-03-21T12:00:00.000Z'))).toBe(
      true
    )
    expect(isBaroKiteerAvailable(new Date('2026-03-22T12:59:00.000Z'))).toBe(
      true
    )
  })

  it('hides Baro outside active weekend and on off-cycle weekend', () => {
    expect(isBaroKiteerAvailable(new Date('2026-03-20T12:59:00.000Z'))).toBe(
      false
    )
    expect(isBaroKiteerAvailable(new Date('2026-03-22T13:00:00.000Z'))).toBe(
      false
    )
    expect(isBaroKiteerAvailable(new Date('2026-03-23T12:00:00.000Z'))).toBe(
      false
    )
    expect(isBaroKiteerAvailable(new Date('2026-03-27T12:00:00.000Z'))).toBe(
      false
    )
  })

  it('shows Baro again after two weeks', () => {
    expect(isBaroKiteerAvailable(new Date('2026-04-03T12:00:00.000Z'))).toBe(
      false
    )
    expect(isBaroKiteerAvailable(new Date('2026-04-03T13:00:00.000Z'))).toBe(
      true
    )
  })

  it('computes next Baro weekend start while unavailable', () => {
    const next = getNextBaroAvailabilityStartUtc(
      new Date('2026-03-25T12:00:00.000Z')
    )
    expect(next.toISOString()).toBe('2026-04-03T13:00:00.000Z')
  })

  it('computes next Baro weekend start before anchor date', () => {
    const next = getNextBaroAvailabilityStartUtc(
      new Date('2026-03-18T12:00:00.000Z')
    )
    expect(next.toISOString()).toBe('2026-03-20T13:00:00.000Z')
  })
})
