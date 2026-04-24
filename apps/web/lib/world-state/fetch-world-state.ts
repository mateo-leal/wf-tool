import { FetchError } from '../errors'
import { OracleWorldState } from './types'

const ORACLE_WORLD_STATE_URL = 'https://oracle.browse.wf/worldState.json'

export async function fetchOracleWorldState(): Promise<OracleWorldState> {
  const response = await fetch(ORACLE_WORLD_STATE_URL, {
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new FetchError(response.status)
  }

  return (await response.json()) as OracleWorldState
}
