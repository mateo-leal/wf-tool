import { NOISE_TYPES, TRIGGER_TYPES, VARIANT_TYPES } from '../lib/constants'

export type Noise = (typeof NOISE_TYPES)[number]
export type Trigger = (typeof TRIGGER_TYPES)[number]
export type VariantType = (typeof VARIANT_TYPES)[number]

// MARK: Utility types
export type UniqueName = string
export type TranslationKey = string
export type Dictionary = Record<string, string>

// MARK: Shared types
export interface BaseItem {
  uniqueName: UniqueName
}

export interface VisualData {
  name: TranslationKey
  icon: string
  description: TranslationKey
  codexSecret: boolean
  introducedAt?: number
}

export interface MarketData {
  platinumCost?: number
  premiumPrice?: number
  creditsCost?: number
  excludeFromMarket?: boolean
  tradable: boolean
}

export interface CombatStats {
  health: number
  shield: number
  armor: number
  stamina: number
  power: number
}

export interface RangedStats {
  accuracy: number
  noise: Noise
  trigger: Trigger
  magazineSize?: number
  reloadTime?: number
  multishot: number
}

export interface CriticalStats {
  damagePerShot?: number[]
  totalDamage?: number
  criticalChance: number
  criticalMultiplier: number
  procChance: number
  fireRate: number
  omegaAttenuation: number
}

export interface MeleeStats {
  blockingAngle?: number
  comboDuration?: number
  followThrough?: number
  range?: number
  slamAttack?: number
  slamRadialDamage?: number
  slamRadius?: number
  slideAttack?: number
  heavyAttackDamage?: number
  heavySlamAttack?: number
  heavySlamRadialDamage?: number
  heavySlamRadius?: number
  windUp?: number
}

export type DefaultUpgrade = {
  ItemType: UniqueName
  Slot: number
}
