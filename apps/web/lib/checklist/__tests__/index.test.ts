import {
  createEmptyChecklistState,
  formatRemainingTime,
  getChecklistTaskCounter,
  getEightHoursPeriodKey,
  getHourlyPeriodKey,
  getDailyResetKey,
  getTimeUntilNextEightHourReset,
  getTimeUntilNextHourlyReset,
  getTimeUntilNextUtcDay,
  getTimeUntilNextUtcWeek,
  getSortiePeriodKey,
  getWeeklyResetKey,
  normalizeChecklistState,
} from '..'
import { getBaroPeriodKey, isBaroKiteerAvailable } from '../../world-state/baro'
import { OracleWorldState } from '../../world-state/types'

function createSortieWorldState(
  activationIso: string,
  expiryIso: string
): OracleWorldState {
  return {
    Events: [],
    LiteSorties: [],
    VoidTraders: [],
    Sorties: [
      {
        _id: { $oid: 'sortie-1' },
        Activation: {
          $date: { $numberLong: String(new Date(activationIso).getTime()) },
        },
        Expiry: {
          $date: { $numberLong: String(new Date(expiryIso).getTime()) },
        },
        Reward: 'SORTIE_REWARD_TEST',
        Seed: 1,
        Boss: 'SORTIE_BOSS_TEST',
        ExtraDrops: [],
        Variants: [],
        Twitter: false,
      },
    ],
  }
}

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

  it('returns time to next 8-hour reset anchored at 08:00 UTC', () => {
    expect(
      getTimeUntilNextEightHourReset(new Date('2026-03-25T07:30:00.000Z'))
    ).toBe(30 * 60 * 1000)

    expect(
      getTimeUntilNextEightHourReset(new Date('2026-03-25T08:00:00.000Z'))
    ).toBe(8 * 60 * 60 * 1000)

    expect(
      getTimeUntilNextEightHourReset(new Date('2026-03-25T23:30:00.000Z'))
    ).toBe(30 * 60 * 1000)
  })

  it('returns checklist counter for 8-hour resets', () => {
    const counter = getChecklistTaskCounter(
      { resets: 'eightHours' },
      new Date('2026-03-25T15:10:00.000Z')
    )

    expect(counter).toEqual({
      label: 'resetsIn',
      time: {
        days: 0,
        hours: 0,
        minutes: 50,
        seconds: 0,
      },
    })
  })

  it('returns time to next hourly reset', () => {
    expect(
      getTimeUntilNextHourlyReset(new Date('2026-03-25T10:15:00.000Z'))
    ).toBe(45 * 60 * 1000)

    expect(
      getTimeUntilNextHourlyReset(new Date('2026-03-25T10:00:00.000Z'))
    ).toBe(60 * 60 * 1000)
  })

  it('returns checklist counter for hourly resets', () => {
    const counter = getChecklistTaskCounter(
      { resets: 'hourly' },
      new Date('2026-03-25T10:15:00.000Z')
    )

    expect(counter).toEqual({
      label: 'resetsIn',
      time: {
        days: 0,
        hours: 0,
        minutes: 45,
        seconds: 0,
      },
    })
  })

  it('computes sortie period key on 16:00 UTC boundary', () => {
    const before = new Date('2026-03-25T15:59:59.000Z')
    const atReset = new Date('2026-03-25T16:00:00.000Z')

    expect(getSortiePeriodKey(before)).toBe(
      String(new Date('2026-03-24T16:00:00.000Z').getTime())
    )
    expect(getSortiePeriodKey(atReset)).toBe(
      String(new Date('2026-03-25T16:00:00.000Z').getTime())
    )
  })

  it('returns checklist counter for sortie using fallback reset time', () => {
    const counter = getChecklistTaskCounter(
      { resets: 'sortie' },
      new Date('2026-03-25T15:30:00.000Z')
    )

    expect(counter).toEqual({
      label: 'resetsIn',
      time: {
        days: 0,
        hours: 0,
        minutes: 30,
        seconds: 0,
      },
    })
  })

  it('returns checklist counter for active sortie using world state expiry', () => {
    const worldState = createSortieWorldState(
      '2026-03-25T10:00:00.000Z',
      '2026-03-25T12:00:00.000Z'
    )

    const counter = getChecklistTaskCounter(
      { resets: 'sortie' },
      new Date('2026-03-25T10:15:00.000Z'),
      worldState
    )

    expect(counter).toEqual({
      label: 'resetsIn',
      time: {
        days: 0,
        hours: 1,
        minutes: 45,
        seconds: 0,
      },
    })
  })

  it('returns checklist counter for upcoming sortie using world state activation', () => {
    const worldState = createSortieWorldState(
      '2026-03-25T09:30:00.000Z',
      '2026-03-26T09:30:00.000Z'
    )

    const counter = getChecklistTaskCounter(
      { resets: 'sortie' },
      new Date('2026-03-25T08:00:00.000Z'),
      worldState
    )

    expect(counter).toEqual({
      label: 'resetsIn',
      time: {
        days: 0,
        hours: 1,
        minutes: 30,
        seconds: 0,
      },
    })
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
          eightHoursPeriodKey: getEightHoursPeriodKey(now),
          baroPeriodKey: getBaroPeriodKey(now),
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

  it('clears baro and eightHours other completions when their periods expire', () => {
    const now = new Date('2026-03-30T12:00:00.000Z')
    const normalized = normalizeChecklistState(
      {
        other: {
          // stale period keys — baro and eightHours tasks should be cleared
          eightHoursPeriodKey: '0',
          baroPeriodKey: '0',
          completed: {
            'other-baro': true,
            'other-entrati-tokens': true,
            'other-voidplume-trade': true,
          },
        },
      },
      now
    )

    expect(normalized.other.completed).toEqual({})
  })

  it('clears hourly other completions when the hourly period expires', () => {
    const now = new Date('2026-03-30T12:25:00.000Z')
    const normalized = normalizeChecklistState(
      {
        other: {
          hourlyPeriodKey: '0',
          eightHoursPeriodKey: getEightHoursPeriodKey(now),
          baroPeriodKey: getBaroPeriodKey(now),
          sortiePeriodKey: getSortiePeriodKey(now),
          completed: {
            'other-arbitration': true,
            'other-baro': true,
          },
        },
      },
      now
    )

    expect(normalized.other.completed).toEqual({
      'other-baro': true,
    })
  })

  it('clears sortie other completions when the sortie period expires', () => {
    const now = new Date('2026-03-30T12:25:00.000Z')
    const normalized = normalizeChecklistState(
      {
        other: {
          hourlyPeriodKey: getHourlyPeriodKey(now),
          eightHoursPeriodKey: getEightHoursPeriodKey(now),
          baroPeriodKey: getBaroPeriodKey(now),
          sortiePeriodKey: '0',
          completed: {
            'other-sortie': true,
            'other-baro': true,
          },
        },
      },
      now
    )

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

  it('preserves hidden items across period changes', () => {
    const now = new Date('2026-03-30T12:00:00.000Z')

    const normalized = normalizeChecklistState(
      {
        daily: {
          periodKey: '2026-03-29',
          completed: {
            'daily-login-reward': true,
          },
          hidden: {
            'daily-login-reward': true,
            'daily-vendors': true,
          },
        },
        weekly: {
          periodKey: '2026-03-23',
          hidden: {
            'weekly-vendors': true,
          },
        },
        other: {
          hidden: {
            'other-baro': true,
          },
        },
      },
      now
    )

    expect(normalized.daily.completed).toEqual({})
    expect(normalized.daily.hidden).toEqual({
      'daily-login-reward': true,
      'daily-vendors': true,
    })
    expect(normalized.weekly.hidden).toEqual({
      'weekly-vendors': true,
    })
    expect(normalized.other.hidden).toEqual({
      'other-baro': true,
    })
  })

  it('preserves expanded groups across period changes', () => {
    const now = new Date('2026-03-30T12:00:00.000Z')

    const normalized = normalizeChecklistState(
      {
        daily: {
          periodKey: '2026-03-29',
          expandedGroups: {
            'daily-world-syndicates': false,
            'daily-vendors': true,
          },
        },
        weekly: {
          periodKey: '2026-03-23',
          expandedGroups: {
            'weekly-vendors': false,
          },
        },
      },
      now
    )

    expect(normalized.daily.expandedGroups).toEqual({
      'daily-world-syndicates': false,
      'daily-vendors': true,
    })
    expect(normalized.weekly.expandedGroups).toEqual({
      'weekly-search-pulses': true,
      'weekly-vendors': false,
    })
  })

  it('drops invalid hidden ids during normalization', () => {
    const now = new Date('2026-03-30T12:00:00.000Z')

    const normalized = normalizeChecklistState(
      {
        daily: {
          periodKey: getDailyResetKey(now),
          hidden: {
            'daily-login-reward': true,
            'invalid-task': true,
          },
        },
      },
      now
    )

    expect(normalized.daily.hidden).toEqual({
      'daily-login-reward': true,
    })
  })

  it('formats remaining time with day values', () => {
    const counter = formatRemainingTime(
      2 * 24 * 60 * 60 * 1000 + 75 * 60 * 1000
    )
    expect(counter).toEqual({
      days: 2,
      hours: 1,
      minutes: 15,
      seconds: 0,
    })
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
})
