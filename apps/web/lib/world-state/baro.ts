import { OracleWorldState } from './types'

// Known Baro weekend anchor in UTC. Availability repeats every 14 days.
// Baro arrives Friday 13:00 UTC and leaves Sunday 13:00 UTC.
// Used as fallback when API data is unavailable.
export const BARO_ANCHOR_START_UTC = Date.UTC(2026, 2, 20, 13, 0, 0)
export const BARO_PERIOD_MS = 14 * 24 * 60 * 60 * 1000
export const BARO_ACTIVE_WINDOW_MS = 48 * 60 * 60 * 1000

export function getBaro(worldState?: OracleWorldState) {
  return worldState?.VoidTraders.find(
    (trader) => trader.Character === "Baro'Ki Teel"
  )
}

function getBaroTimes(worldState?: OracleWorldState) {
  const baro = getBaro(worldState)
  if (!baro) return undefined

  return {
    activationMs: Number(baro.Activation.$date.$numberLong),
    expiryMs: Number(baro.Expiry.$date.$numberLong),
  }
}

export function isBaroKiteerAvailable(
  now: Date,
  worldState?: OracleWorldState
): boolean {
  const nowMs = now.getTime()

  const baroInfo = getBaroTimes(worldState)

  if (baroInfo) {
    return nowMs >= baroInfo.activationMs && nowMs < baroInfo.expiryMs
  }

  if (nowMs < BARO_ANCHOR_START_UTC) {
    return false
  }

  const phaseMs = (nowMs - BARO_ANCHOR_START_UTC) % BARO_PERIOD_MS

  return phaseMs >= 0 && phaseMs < BARO_ACTIVE_WINDOW_MS
}

export function getBaroPeriodKey(now: Date): string {
  const nowMs = now.getTime()
  if (nowMs < BARO_ANCHOR_START_UTC) {
    return String(BARO_ANCHOR_START_UTC)
  }
  const phaseMs = (nowMs - BARO_ANCHOR_START_UTC) % BARO_PERIOD_MS
  return String(nowMs - phaseMs)
}

export function getTimeUntilNextBaroChange(
  now: Date,
  worldState?: OracleWorldState
): number {
  const nowMs = now.getTime()

  const baroTime = getBaroTimes(worldState)

  if (baroTime && baroTime.expiryMs > nowMs) {
    // API data is still relevant (Baro is active or upcoming)
    if (nowMs >= baroTime.activationMs) {
      return baroTime.expiryMs - nowMs
    }
    return baroTime.activationMs - nowMs
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
