import {
  AMP_COMPATIBILITY_TAGS,
  AMP_PART_TYPES,
  ANTIGEN_PART_TYPES,
  ARCHGUN_COMPATIBILITY_TAGS,
  ARCHGUN_HOLSTER_CATEGORY,
  ARCHMELEE_HOLSTER_CATEGORY,
  DAMAGE_TYPES,
  DRIFTER_MELEE_COMPATIBILITY_TAGS,
  DRIFTER_MELEE_HOLSTER_CATEGORIES,
  HOUND_PART_TYPES,
  KDRIVE_PART_TYPES,
  KITGUN_PART_TYPES,
  MELEE_COMPATIBILITY_TAGS,
  MELEE_HOLSTER_CATEGORY,
  MOA_PART_TYPES,
  MUTAGEN_PART_TYPES,
  PRIMARY_COMPATIBILITY_TAGS,
  PRIMARY_HOLSTER_CATEGORIES,
  SECONDARY_COMPATIBILITY_TAGS,
  SECONDARY_HOLSTER_CATEGORY,
  SENTINEL_WEAPON_COMPATIBILITY_TAGS,
  SENTINEL_WEAPON_HOLSTER_CATEGORY,
  SPECIAL_ITEM_COMPATIBILITY_TAGS,
  SPECIAL_ITEM_HOLSTER_CATEGORY,
  ZAW_PART_TYPES,
} from '../lib/constants'
import {
  BaseItem,
  CriticalStats,
  DefaultUpgrade,
  MarketData,
  MeleeStats,
  Noise,
  RangedStats,
  Trigger,
  VariantType,
  VisualData,
} from './base'

type DamageType = (typeof DAMAGE_TYPES)[number]

type Behaviour = {
  fireIterations?: number
  impact?: Impact
  stateName?: string
  projectile?: Projectile
  burst?: Burst
  chargedProjectile?: ChargedProjectile
}

type Projectile = {
  attack?: Attack
  explosiveAttack?: ExplosiveAttack
  embedDeathAttack?: EmbedDeathAttack
}

type Burst = {
  count: number
  delay: number
}

type ChargedProjectile = Projectile & {
  attack: Attack // Required for charged
}

type Attack = {
  [K in DamageType]?: number
} & {
  procChance?: number
}

type Impact = Attack
type ExplosiveAttack = Attack
type EmbedDeathAttack = Attack

type PrimaryHolsterCategory = (typeof PRIMARY_HOLSTER_CATEGORIES)[number]
type PrimaryCompatibilityTag = (typeof PRIMARY_COMPATIBILITY_TAGS)[number]

type SecondaryHolsterCategory = (typeof SECONDARY_HOLSTER_CATEGORY)[number]
type SecondaryCompatibilityTag = (typeof SECONDARY_COMPATIBILITY_TAGS)[number]

type MeleeHolsterCategory = (typeof MELEE_HOLSTER_CATEGORY)[number]
type MeleeCompatibilityTag = (typeof MELEE_COMPATIBILITY_TAGS)[number]

type ArchgunHolsterCategory = (typeof ARCHGUN_HOLSTER_CATEGORY)[number]
type ArchgunCompatibilityTag = (typeof ARCHGUN_COMPATIBILITY_TAGS)[number]

type ArchmeleeHolsterCategory = (typeof ARCHMELEE_HOLSTER_CATEGORY)[number]

type AmpPartType = (typeof AMP_PART_TYPES)[number]
type AmpCompatibilityTag = (typeof AMP_COMPATIBILITY_TAGS)[number]

type KitgunPartType = (typeof KITGUN_PART_TYPES)[number]

type ZawPartType = (typeof ZAW_PART_TYPES)[number]

type SentinelWeaponCompatibilityTag =
  (typeof SENTINEL_WEAPON_COMPATIBILITY_TAGS)[number]
type SentinelWeaponHolsterCategory =
  (typeof SENTINEL_WEAPON_HOLSTER_CATEGORY)[number]

type SpecialItemHolsterCategory = (typeof SPECIAL_ITEM_HOLSTER_CATEGORY)[number]
type SpecialItemCompatibilityTag =
  (typeof SPECIAL_ITEM_COMPATIBILITY_TAGS)[number]

type DrifterMeleeHolsterCategory =
  (typeof DRIFTER_MELEE_HOLSTER_CATEGORIES)[number]
type DrifterMeleeCompatibilityTag =
  (typeof DRIFTER_MELEE_COMPATIBILITY_TAGS)[number]

type AntigenPartType = (typeof ANTIGEN_PART_TYPES)[number]
type HoundPartType = (typeof HOUND_PART_TYPES)[number]
type KDrivePartType = (typeof KDRIVE_PART_TYPES)[number]
type MOAPartType = (typeof MOA_PART_TYPES)[number]
type MutagenPartType = (typeof MUTAGEN_PART_TYPES)[number]

interface WeaponBase extends BaseItem, VisualData, CriticalStats, MarketData {
  parentName: string
  masteryReq: number
  slot?: number
  behaviours?: Behaviour[]
  variantType: VariantType
  defaultUpgrades?: DefaultUpgrade[]
  maxLevelCap?: number
}

/**
 * Base for modular components (Zaws, Kitguns, Amps, Hounds, etc.)
 * These share a pattern of partTypes and Standing bonuses.
 */
export interface ModularBase extends WeaponBase {
  partType: string
  donationStandingBonus: number
}

export type PrimaryWeapon = WeaponBase &
  RangedStats & {
    productCategory: 'LongGuns'
    holsterCategory: PrimaryHolsterCategory
    compatibilityTags?: PrimaryCompatibilityTag[]
  }

export type SecondaryWeapon = WeaponBase &
  RangedStats & {
    productCategory: 'Pistols'
    holsterCategory?: SecondaryHolsterCategory
    compatibilityTags?: SecondaryCompatibilityTag[]
  }

export type Melee = WeaponBase &
  MeleeStats & {
    productCategory: 'Melee'
    holsterCategory?: MeleeHolsterCategory
    compatibilityTags: MeleeCompatibilityTag[]
  }

// MARK: Archwing Weaponry
export type Archgun = WeaponBase &
  RangedStats & {
    productCategory: 'SpaceGuns'
    holsterCategory?: ArchgunHolsterCategory
    compatibilityTags: ArchgunCompatibilityTag[]
    // Archguns have specific constraints on Noise and Trigger
    noise: Exclude<Noise, 'SILENT'>
    trigger: Exclude<Trigger, 'ACTIVE' | 'DUPLEX'>
  }

export type Archmelee = WeaponBase &
  MeleeStats & {
    productCategory: 'SpaceMelee'
    holsterCategory: ArchmeleeHolsterCategory
  }

// MARK: Modular Weapons
export type Amp =
  | (ModularBase & {
      productCategory: 'Pistols' // Common for modular parts
      partType: AmpPartType
      excludeFromCodex?: boolean
    })
  | Sirocco

// Special case for the non-modular Drifter Amp
type Sirocco = WeaponBase &
  RangedStats & {
    uniqueName: '/Lotus/Weapons/Operator/Pistols/DrifterPistol/DrifterPistolPlayerWeapon'
    productCategory: 'OperatorAmps'
    holsterCategory: 'PISTOL'
    noise: Extract<Noise, 'SILENT'>
    trigger: Extract<Trigger, 'SEMI'>
    compatibilityTags: AmpCompatibilityTag[]
  }

export type Kitgun = ModularBase & {
  productCategory: 'Pistols'
  partType: KitgunPartType
}

export type Zaw = ModularBase & {
  productCategory: 'Pistols'
  partType: ZawPartType
  excludeFromCodex?: boolean
}

// MARK: Companion & Special Weaponry
export type SentinelWeapon = WeaponBase &
  RangedStats &
  MeleeStats & {
    productCategory: 'SentinelWeapons'
    holsterCategory?: SentinelWeaponHolsterCategory
    sentinel: boolean // Unique flag for this category
    compatibilityTags: SentinelWeaponCompatibilityTag[]
    variantType: Extract<VariantType, 'VT_NORMAL' | 'VT_PRIME'>
    excludeFromCodex?: boolean
  }

/**
 * Special items (like the Paracesis or quest weapons)
 * often combine both Ranged and Melee capabilities.
 */
type SpecialItem = WeaponBase &
  RangedStats &
  MeleeStats & {
    productCategory: 'SpecialItems'
    holsterCategory?: SpecialItemHolsterCategory
    compatibilityTags?: SpecialItemCompatibilityTag[]
    excludeFromCodex: boolean
  }

type DrifterMelee = BaseItem &
  VisualData &
  MarketData & {
    productCategory: 'DrifterMelee'
    holsterCategory: DrifterMeleeHolsterCategory
    omegaAttenuation: number
    compatibilityTags: DrifterMeleeCompatibilityTag[]
    variantType: Extract<VariantType, 'VT_NORMAL'>
    behaviours: Behaviour[]
    masteryReq?: number
  }

// MARK: Additional Modular Types
export type Hound = ModularBase & {
  productCategory: 'Pistols'
  partType: HoundPartType
}

export type MOA = ModularBase & {
  productCategory: 'Pistols'
  partType: MOAPartType
}

export type KDrive = ModularBase & {
  productCategory: 'Pistols'
  partType: KDrivePartType
}

type Antigen = ModularBase & {
  productCategory: 'Pistols'
  partType: AntigenPartType
  excludeFromCodex: boolean
}

type Mutagen = ModularBase & {
  productCategory: 'Pistols'
  partType: MutagenPartType
  excludeFromCodex: boolean
}

type OtherWeapons = Hound | MOA | KDrive | Antigen | Mutagen

export type Weapon =
  | PrimaryWeapon
  | SecondaryWeapon
  | Melee
  | Archgun
  | Archmelee
  | Amp
  | Kitgun
  | Zaw
  | SentinelWeapon
  | SpecialItem
  | DrifterMelee
  | OtherWeapons
