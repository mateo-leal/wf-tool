export type OracleWorldState = {
  VoidTraders: Array<VoidTrader>
  Events: OracleWorldEvent[]
}

export type VoidTrader = {
  _id: OracleWorldStateId
  Activation: OracleWorldStateDate
  Expiry: OracleWorldStateDate
  Character: string
  Node: string
}

type OracleWorldStateId = {
  $oid: string
}

type OracleWorldEventMessage = {
  LanguageCode?: string
  Message?: string
}

type OracleWorldStateDate = {
  $date: {
    $numberLong: string
  }
}

type OracleWorldEventLink = {
  LanguageCode: string
  Link: string
}

export type OracleWorldEvent = {
  _id: OracleWorldStateId
  Messages: OracleWorldEventMessage[]
  Prop: string
  Community?: boolean
  Date?: OracleWorldStateDate
  Links?: OracleWorldEventLink[]
}

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
  const node = worldState.VoidTraders[0]
  return node ? node : null
}

export async function fetchEventsNode() {
  const worldState = await fetchOracleWorldState()
  return worldState.Events
}
