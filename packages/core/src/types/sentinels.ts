// --- COMPANION BASE ---

import {
  BaseItem,
  CombatStats,
  DefaultUpgrade,
  MarketData,
  UniqueName,
  VisualData,
} from './base'

/**
 * Common properties for all robotic and organic companions.
 */
interface CompanionBase extends BaseItem, VisualData, MarketData {}

// --- SPECIFIC COMPANION SUBTYPES ---

type SentinelStandard = CompanionBase &
  CombatStats & {
    productCategory: 'Sentinels'
    defaultWeapon: UniqueName
    defaultUpgrades: DefaultUpgrade[]
  }

export type KubrowPet = CompanionBase &
  CombatStats & {
    productCategory: 'KubrowPets'
    exalted: UniqueName[] // Used for Hidden Weapons/Claws
    defaultUpgrades: DefaultUpgrade[]
    excludeFromMarket: boolean
  }

type MoaPet = CompanionBase & {
  productCategory: 'MoaPets'
  defaultWeapon?: UniqueName
  excludeFromMarket: boolean
  // Note: Moas get stats from their modular parts,
  // so CombatStats are often omitted in the base item.
}

export type SpecialItem = CompanionBase &
  CombatStats & {
    productCategory: 'SpecialItems'
    exalted: UniqueName[]
    excludeFromCodex: boolean
    excludeFromMarket: boolean
  }

// --- THE UNION TYPE ---

/**
 * A union of all companion types.
 * When checking 'productCategory', TypeScript will narrow the type automatically.
 */
export type Sentinel = SentinelStandard | KubrowPet | MoaPet | SpecialItem
