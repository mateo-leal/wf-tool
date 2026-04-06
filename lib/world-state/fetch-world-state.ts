export type OracleWorldState = {
  VoidTraders?: Array<{
    Node?: string | null
  }>
  Events: OracleWorldEvent[]
}

type OracleWorldEventId = {
  $oid: string
}

type OracleWorldEventMessage = {
  LanguageCode?: string
  Message?: string
}

type OracleWorldEventDate = {
  $date: {
    $numberLong: string
  }
}

type OracleWorldEventLink = {
  LanguageCode: string
  Link: string
}

export type OracleWorldEvent = {
  _id: OracleWorldEventId
  Messages: OracleWorldEventMessage[]
  Prop: string
  Community?: boolean
  Date?: OracleWorldEventDate
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

export function getVoidTraderNode(worldState: OracleWorldState): string | null {
  const node = worldState.VoidTraders?.[0]?.Node
  return typeof node === 'string' && node.trim().length > 0 ? node.trim() : null
}

export async function fetchEventsNode() {
  const worldState = await fetchOracleWorldState()
  return worldState.Events
}
