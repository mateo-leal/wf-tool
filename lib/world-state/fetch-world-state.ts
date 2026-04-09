import { OracleWorldState } from './types'

const ORACLE_WORLD_STATE_URL = 'https://oracle.browse.wf/worldState.json'

export async function fetchOracleWorldState(): Promise<OracleWorldState> {
  const response = await fetch(ORACLE_WORLD_STATE_URL, {
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch world state: ${response.status}`)
  }

  return (await response.json()) as OracleWorldState
}

export function getVoidTrader(worldState: OracleWorldState) {
  return worldState.VoidTraders?.[0] ?? null
}

export async function fetchEvents() {
  const worldState = await fetchOracleWorldState()
  return worldState.Events
}
