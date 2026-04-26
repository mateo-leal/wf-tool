export type Counter = {
  days: number
  hours: number
  minutes: number
  seconds: number
}

export type BountyCycles = {
  expiry: number
  rot: string
  vaultRot: string
  zarimanFaction: string
  bounties: Record<
    string,
    {
      node: string
      challenge: string
      ally?: string
    }[]
  >
}

export type ArbitrationCycle = {
  timestamp: number
  node: string
}

export type WorldCycle = {
  expiry: number
  state: string
}
