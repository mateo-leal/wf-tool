import {
  BaseItem,
  CombatStats,
  MarketData,
  TranslationKey,
  UniqueName,
  VariantType,
  VisualData,
} from './base'

type WarframeVariantType = Extract<
  VariantType,
  'VT_NORMAL' | 'VT_PRIME' | 'VT_VARIANT'
>

type Ability = BaseItem & {
  name: TranslationKey
  description: TranslationKey
  icon: string
  energyRequiredToActivate: number
  energyConsumptionOverTime?: number
}

/**
 * Base Interface for all playable "Suits"
 * (Warframes, Archwings, Necramechs)
 */
interface SuitBase extends BaseItem, VisualData, CombatStats, MarketData {
  parentName: UniqueName
  masteryReq: number
  sprintSpeed: number
  abilities: Ability[]
}

// --- WARFRAME ---
export type Warframe = SuitBase & {
  productCategory: 'Suits'
  variantType: WarframeVariantType
  passiveDescription: TranslationKey
  introducedAt: number

  // Optional/Conditional fields
  exalted?: UniqueName[]
  additionalItems?: UniqueName[]
  nemesisUpgradeTag?: string
  longDescription?: TranslationKey
}

// --- ARCHWING ---
export type Archwing = SuitBase & {
  productCategory: 'SpaceSuits'
  variantType: Extract<VariantType, 'VT_NORMAL'>
  introducedAt: number
}

// --- NECRAMECH ---
export type Necramech = SuitBase & {
  productCategory: 'MechSuits'
  variantType: Extract<VariantType, 'VT_NORMAL'>
  introducedAt: number

  // Necramechs have specific rank/exalted requirements
  exalted: UniqueName[]
  maxLevelCap: number // Necramechs go to level 40
  additionalItems: UniqueName[]
}
