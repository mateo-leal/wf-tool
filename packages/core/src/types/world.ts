import { FACTION_IDS, MISSION_TYPE_IDS } from '../lib/constants'
import { BaseItem, TranslationKey, UniqueName } from './base'

type MissionTypeId = (typeof MISSION_TYPE_IDS)[number]
type FactionId = (typeof FACTION_IDS)[number]

/**
 * Simple Index/Name pairs for global lookups
 */
export type Faction = BaseItem & IndexNamePair
export type MissionType = BaseItem & IndexNamePair

// --- REGIONS (Star Chart Nodes) ---

/**
 * Represents a node on the Star Chart (Standard, Railjack, or Duviri)
 */
export type Region = BaseItem & {
  name: TranslationKey
  systemIndex: number
  systemName: TranslationKey
  nodeType: number
  masteryReq: number

  // Mission Data
  missionType: MissionTypeId
  missionIndex: number
  missionName: TranslationKey
  tileset?: string

  // Faction Data
  faction?: FactionId
  factionIndex?: number
  factionName?: TranslationKey
  secondaryFaction?: FactionId
  secondaryFactionIndex?: number
  secondaryFactionName?: TranslationKey

  // Leveling & Mastery
  minEnemyLevel: number
  maxEnemyLevel: number
  masteryExp: number
  levelOverride?: UniqueName

  // Rewards & Logic
  rewardManifests: UniqueName[]
  cacheRewardManifest?: UniqueName
  missionReward?: MissionReward
  nextNodes: UniqueName[] // Recursive reference

  // Spawning & Special Data
  enemySpec?: UniqueName
  extraEnemySpec?: UniqueName
  customAdvancedSpawners?: UniqueName[]
  vipAgent?: UniqueName
  darkSectorData?: DarkSectorData
  questReq?: UniqueName
  miscItemFee?: MiscItemFee
  challenges?: UniqueName[]
  hidden?: boolean
}

// --- PROGRESSION (Intrinsics) ---

export type Intrinsic = BaseItem & {
  name: TranslationKey
  description: TranslationKey
  icon: string
  ranks: Rank[]
}

// --- SUPPORTING STRUCTURES ---

type IndexNamePair = {
  index: number
  name?: string
}

type Rank = {
  name: TranslationKey
  description: TranslationKey
}

type MissionReward = {
  credits?: number
  items?: string[]
  countedItems?: CountedItem[]
}

type CountedItem = {
  ItemType: string
  ItemCount: number
}

type DarkSectorData = {
  resourceBonus: number
  xpBonus: number
  weaponXpBonusFor: string
  weaponXpBonusVal: number
}

type MiscItemFee = {
  ItemType: string
  ItemCount: number
}
