import {
  resolveDictName,
  type PublicExportIntrinsic,
  type PublicExportDictionary,
} from '@/lib/public-export/fetch-public-export'

export type MasteryCategory =
  | 'itemCompletion'
  | 'railjackIntrinsic'
  | 'drifterIntrinsic'
  | 'starchartCompletion'

export type MasteryItem = {
  id: string
  name: string
  iconUrl?: string
  masteryReq?: number
  rankNumber?: number
  masteryPoints?: number
}

type MasteryByCategory = {
  itemCompletion: Record<string, MasteryItem[]>
  railjackIntrinsic: Record<string, MasteryItem[]>
  drifterIntrinsic: Record<string, MasteryItem[]>
  starchartCompletion: Record<string, MasteryItem[]>
}

type MasterySubcategoryLabels = Record<MasteryCategory, Record<string, string>>

export type MasteryData = MasteryByCategory & {
  subcategoryLabels: MasterySubcategoryLabels
}

export const CATEGORY_ORDER: MasteryCategory[] = [
  'itemCompletion',
  'railjackIntrinsic',
  // 'drifterIntrinsic',
  // 'starchartCompletion',
]

// Items with 6000 MP
const HIGH_MASTERY_SUBCATEGORIES = new Set([
  'warframe',
  'sentinel',
  'moa',
  'hound',
  'beast',
  'archwing',
  'kDrive',
])

const RAILJACK_INTRINSIC_MASTERY_POINTS = 1500

function getItemMasteryPoints(
  subcategory: string,
  maxLevelCap?: number
): number {
  if (subcategory === 'necramech') {
    return 8000
  }
  if (HIGH_MASTERY_SUBCATEGORIES.has(subcategory)) {
    return 6000
  }
  if (maxLevelCap === 40) {
    return 4000
  }
  return 3000
}

function toSortedItems(entries: MasteryItem[]): MasteryItem[] {
  return entries.sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
  )
}

function buildIconUrl(iconPath: string | undefined): string | undefined {
  if (!iconPath || iconPath.trim().length === 0) {
    return undefined
  }

  return `https://browse.wf${iconPath}`
}

export function buildMasteryData(
  dict: PublicExportDictionary,
  weaponsMap: Record<
    string,
    {
      name?: string
      icon?: string
      productCategory?: string
      masteryReq?: number
      partType?: string
      maxLevelCap?: number
    }
  >,
  warframesMap: Record<
    string,
    {
      name?: string
      icon?: string
      productCategory?: string
      masteryReq?: number
    }
  >,
  sentinelsMap: Record<
    string,
    {
      name?: string
      icon?: string
      productCategory?: string
      masteryReq?: number
    }
  >,
  intrinsicsMap: Record<string, PublicExportIntrinsic>
): MasteryData {
  const data: MasteryByCategory = {
    itemCompletion: {
      warframe: [],
      primary: [],
      secondary: [],
      melee: [],
      kitgun: [],
      zaw: [],
      amp: [],
      sentinel: [],
      moa: [],
      hound: [],
      beast: [],
      robotic: [],
      archwing: [],
      archgun: [],
      archmelee: [],
      necramech: [],
      railjack: [],
      kDrive: [],
    },
    railjackIntrinsic: {
      // Intrinsic schools are keyed dynamically by API values (e.g. LPS_COMMAND)
    },
    drifterIntrinsic: {},
    starchartCompletion: {},
  }

  const subcategoryLabels: MasterySubcategoryLabels = {
    itemCompletion: {},
    railjackIntrinsic: {},
    drifterIntrinsic: {},
    starchartCompletion: {},
  }

  for (const [intrinsicKey, intrinsic] of Object.entries(intrinsicsMap)) {
    if (!data.railjackIntrinsic[intrinsicKey]) {
      data.railjackIntrinsic[intrinsicKey] = []
    }

    const schoolFallback = intrinsicKey.replace('LPS_', '').toLowerCase()
    const schoolName = resolveDictName(dict, intrinsic.name, schoolFallback)
    subcategoryLabels.railjackIntrinsic[intrinsicKey] = schoolName
    const ranks = intrinsic.ranks ?? []

    if (ranks.length === 0) {
      data.railjackIntrinsic[intrinsicKey].push({
        id: `intrinsic:${intrinsicKey}`,
        name: schoolName,
        iconUrl: buildIconUrl(intrinsic.icon),
        masteryPoints: RAILJACK_INTRINSIC_MASTERY_POINTS,
      })
      continue
    }

    for (const [index, rank] of ranks.entries()) {
      const rankNumber = index + 1
      const rankFallback = `${schoolName} ${rankNumber}`
      const rankName = resolveDictName(dict, rank.name, rankFallback)

      data.railjackIntrinsic[intrinsicKey].push({
        id: `intrinsic:${intrinsicKey}:${rankNumber}`,
        name: rankName,
        iconUrl: buildIconUrl(intrinsic.icon),
        rankNumber,
        masteryPoints: RAILJACK_INTRINSIC_MASTERY_POINTS,
      })
    }
  }

  for (const [path, frame] of Object.entries(warframesMap)) {
    const category = frame.productCategory
    let targetSubcategory: string | null = null

    if (category === 'Suits') {
      targetSubcategory = 'warframe'
    } else if (category === 'SpaceSuits') {
      targetSubcategory = 'archwing'
    } else if (category === 'MechSuits') {
      targetSubcategory = 'necramech'
    }

    if (!targetSubcategory) {
      continue
    }

    const fallback = path.split('/').pop() ?? path
    data.itemCompletion[targetSubcategory].push({
      id: `warframe:${path}`,
      name: resolveDictName(dict, frame.name, fallback),
      iconUrl: buildIconUrl(frame.icon),
      masteryReq: frame.masteryReq,
      masteryPoints: getItemMasteryPoints(targetSubcategory),
    })
  }

  for (const [path, weapon] of Object.entries(weaponsMap)) {
    if (
      // Exclude amp parts
      weapon.partType === 'LWPT_AMP_BRACE' ||
      weapon.partType === 'LWPT_AMP_CORE' ||
      // Exclude Zanuka parts
      weapon.partType === 'LWPT_ZANUKA_BODY' ||
      weapon.partType === 'LWPT_ZANUKA_LEG' ||
      weapon.partType === 'LWPT_ZANUKA_TAIL' ||
      // Exclude Mutagen
      weapon.partType === 'LWPT_CATBROW_MUTAGEN' ||
      weapon.partType === 'LWPT_KUBROW_MUTAGEN' ||
      // Exclude Antigen
      weapon.partType === 'LWPT_CATBROW_ANTIGEN' ||
      weapon.partType === 'LWPT_KUBROW_ANTIGEN' ||
      // Exclude Moa Parts
      weapon.partType === 'LWPT_MOA_PAYLOAD' ||
      weapon.partType === 'LWPT_MOA_ENGINE' ||
      weapon.partType === 'LWPT_MOA_LEG' ||
      // Exclude K-Drive Parts
      weapon.partType === 'LWPT_HB_ENGINE' ||
      weapon.partType === 'LWPT_HB_FRONT' ||
      weapon.partType === 'LWPT_HB_JET' ||
      // Exclude Kitgun Parts
      weapon.partType === 'LWPT_GUN_CLIP' ||
      weapon.partType === 'LWPT_GUN_PRIMARY_HANDLE' ||
      weapon.partType === 'LWPT_GUN_SECONDARY_HANDLE' ||
      // Exclude Zaw Parts
      weapon.partType === 'LWPT_HILT' ||
      weapon.partType === 'LWPT_HILT_WEIGHT' ||
      // Exclude PvP Variant Zaws
      (weapon.partType === 'LWPT_BLADE' && path?.includes('PvPVariant')) ||
      // Exclude duplicate Grimoire
      path.includes('TnDoppelgangerGrimoire') ||
      // Exclude melee Vinquibus
      path.includes('TnBayonetMeleeWeapon')
    ) {
      continue
    }

    const category = weapon.productCategory
    const partType = weapon.partType
    let targetSubcategory: string | null = null

    if (partType === 'LWPT_AMP_OCULUS') {
      targetSubcategory = 'amp'
    } else if (partType === 'LWPT_HB_DECK') {
      targetSubcategory = 'kDrive'
    } else if (partType === 'LWPT_BLADE') {
      targetSubcategory = 'zaw'
    } else if (partType === 'LWPT_GUN_BARREL') {
      targetSubcategory = 'kitgun'
    } else if (partType === 'LWPT_MOA_HEAD') {
      targetSubcategory = 'moa'
    } else if (partType === 'LWPT_ZANUKA_HEAD') {
      targetSubcategory = 'hound'
    } else if (category === 'LongGuns') {
      targetSubcategory = 'primary'
    } else if (category === 'Pistols') {
      targetSubcategory = 'secondary'
    } else if (category === 'Melee') {
      targetSubcategory = 'melee'
    } else if (category === 'SpaceMelee') {
      targetSubcategory = 'archmelee'
    } else if (category === 'SpaceGuns') {
      targetSubcategory = 'archgun'
    } else if (category === 'OperatorAmps') {
      targetSubcategory = 'amp'
    } else if (category === 'SentinelWeapons') {
      targetSubcategory = 'robotic'
    }

    if (!targetSubcategory) {
      continue
    }

    const fallback = path.split('/').pop() ?? path
    data.itemCompletion[targetSubcategory].push({
      id: `weapon:${path}`,
      name: resolveDictName(dict, weapon.name, fallback),
      iconUrl: buildIconUrl(weapon.icon),
      masteryReq: weapon.masteryReq,
      masteryPoints: getItemMasteryPoints(
        targetSubcategory,
        weapon.maxLevelCap
      ),
    })
  }

  for (const [path, sentinel] of Object.entries(sentinelsMap)) {
    const category = sentinel.productCategory
    let targetSubcategory: string | null = null

    if (category === 'Sentinels') {
      targetSubcategory = 'sentinel'
    } else if (category === 'KubrowPets' || category === 'SpecialItems') {
      targetSubcategory = 'beast'
    }

    if (!targetSubcategory) {
      continue
    }

    const fallback = path.split('/').pop() ?? path
    data.itemCompletion[targetSubcategory].push({
      id: `sentinel:${path}`,
      name: resolveDictName(dict, sentinel.name, fallback),
      iconUrl: buildIconUrl(sentinel.icon),
      masteryReq: sentinel.masteryReq,
      masteryPoints: getItemMasteryPoints(targetSubcategory),
    })
  }

  // Add missing items
  data.itemCompletion.railjack.push({
    id: 'railjack-plexus',
    name: 'Plexus',
    masteryPoints: 6000,
  })

  // Filter empty subcategories per category to avoid showing irrelevant items
  const filterEmptySubcategories = <T extends Record<string, MasteryItem[]>>(
    categoryData: T
  ): T => {
    const result: Record<string, MasteryItem[]> = {}
    for (const [key, items] of Object.entries(categoryData)) {
      if (items.length > 0) {
        result[key] = toSortedItems(items)
      }
    }
    return result as T
  }

  return {
    itemCompletion: filterEmptySubcategories(data.itemCompletion),
    railjackIntrinsic: data.railjackIntrinsic,
    drifterIntrinsic: filterEmptySubcategories(data.drifterIntrinsic),
    starchartCompletion: filterEmptySubcategories(data.starchartCompletion),
    subcategoryLabels,
  }
}
