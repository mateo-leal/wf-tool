export type PublicExportWeapon = {
  name?: string
  icon?: string
  productCategory?: string
  masteryReq?: number
  partType?: string
  maxLevelCap?: number
}

export type PublicExportWarframe = {
  name?: string
  icon?: string
  productCategory?: string
  masteryReq?: number
}

export type PublicExportSentinel = {
  name?: string
  icon?: string
  productCategory?: string
  masteryReq?: number
}

export type PublicExportIntrinsicRank = {
  name?: string
  description?: string
}

export type PublicExportIntrinsic = {
  name?: string
  description?: string
  icon?: string
  ranks?: PublicExportIntrinsicRank[]
}

export type MissionType = {
  index: number
  name?: string
}

export type Region = {
  name: string
  systemIndex: number
  systemName: string
  nodeType: number
  masteryReq: number
  missionType: string
  missionIndex: number
  missionName: string
  faction: string
  factionIndex: number
  factionName: string
  minEnemyLevel: number
  maxEnemyLevel: number
  masteryExp: number
  levelOverride: string
  rewardManifests: string[]
  nextNodes: string[]
}

export type PublicExportMap<T> = Record<string, T>
