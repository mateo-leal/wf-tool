import Items, { Item } from '@wfcd/items'
import {
  MasteryByCategory,
  MasteryData,
  MasteryItem,
  MasterySubcategoryLabels,
} from './types'

const HIGH_MASTERY_SUBCATEGORIES = new Set([
  'warframe',
  'sentinel',
  'moa',
  'hound',
  'beast',
  'archwing',
  'kDrive',
])

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

const subcategories = {
  Warframes: 'warframe',
  Primary: 'primary',
  Secondary: 'secondary',
  Melee: 'melee',
  Pets: 'companion',
  Sentinels: 'robotic',
  SentinelWeapons: 'robotic',
  'Arch-Gun': 'archgun',
  'Arch-Melee': 'archmelee',
  Archwing: 'vehicle',
}

const itemCompletionSubcategoryOrder = {
  warframe: null,
  primary: null,
  secondary: null,
  melee: null,
  robotic: null,
  companion: null,
  vehicle: null,
  archgun: null,
  archmelee: null,
  amp: null,
}

function getItemSubcategory(item: Item): string | undefined {
  let subcategory: string | undefined
  if (item.category === 'Misc') {
    if (item.type === 'K-Drive Component') {
      subcategory = 'vehicle'
    }
    if (item.type === 'Kitgun Component') {
      subcategory = 'secondary'
    }
    if (item.type === 'Amp') {
      subcategory = 'amp'
    }
    // @ts-expect-error - Pets includes productCategory property, but it's not typed in the dependency
  } else if (item.category === 'Pets' && item.productCategory === 'Pistols') {
    subcategory = 'robotic'
  } else if (
    // @ts-expect-error - Primary includes productCategory property, but it's not typed in the dependency
    item.productCategory === 'SentinelWeapons'
  ) {
    subcategory = 'robotic'
    // @ts-expect-error - Warframe includes productCategory property, but it's not typed in the dependency
  } else if (item.productCategory === 'MechSuits') {
    subcategory = 'vehicle'
    // @ts-expect-error - Primary includes productCategory property, but it's not typed in the dependency
  } else if (item.productCategory === 'OperatorAmps') {
    subcategory = 'amp'
  } else {
    // @ts-expect-error - Typescript expects every type of category to be present, but we know that the items we're fetching only belong to the categories we specified
    subcategory = subcategories[item.category]
  }
  return subcategory
}

function toSortedItems(entries: MasteryItem[]): MasteryItem[] {
  return entries.sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
  )
}

// Filter empty subcategories per category to avoid showing irrelevant items
function filterEmptySubcategories(categoryData: Record<string, MasteryItem[]>) {
  const result: Record<string, MasteryItem[]> = {}
  for (const [key, items] of Object.entries(categoryData)) {
    if (items.length > 0) {
      result[key] = toSortedItems(items)
    }
  }
  return result
}

function normalizeItemName(name: string) {
  return name.replace('<ARCHWING>', '')
}

export function getItemCompletion(locale: string) {
  const items = new Items({
    category: [
      'Warframes',
      'Primary',
      'Secondary',
      'Melee',
      'Pets',
      'Sentinels',
      'SentinelWeapons',
      'Arch-Gun',
      'Arch-Melee',
      'Archwing',
      'Misc',
    ],
    // TODO: Update to only load required locales once the dependency supports it
    i18n: true,
    i18nOnObject: true,
  })

  const mappedItems = items
    .filter(
      (item) =>
        item.masterable === true ||
        (item.type === 'Amp' && item.uniqueName.includes('Barrel'))
    )
    .reduce(
      (data, item) => {
        // Exclude duplicate Grimoire
        if (item.uniqueName.includes('TnDoppelgangerGrimoire')) {
          return data
        }
        const subcategory = getItemSubcategory(item)

        if (!subcategory) {
          console.warn(
            `Unknown mastery subcategory for item ${item.name} with category ${item.category} and type ${item.type}`
          )
          return data
        }

        if (!Object.hasOwn(data, subcategory)) {
          data[subcategory] = []
        }
        let name = item.name
        if (locale !== 'en') {
          // @ts-expect-error - We know that i18n will be present because we specified it in the Items constructor
          name = item.i18n?.[locale].name || item.name
        }
        data[subcategory].push({
          id: item.uniqueName,
          name: normalizeItemName(name),
          iconUrl: `https://cdn.warframestat.us/img/${item.imageName}`,
          // @ts-expect-error - this dep has so many type issues
          masteryReq: item.masteryReq ?? 0,
          // @ts-expect-error - this dep has so many type issues
          masteryPoints: getItemMasteryPoints(subcategory, item.maxLevelCap),
        })
        return data
      },
      {} as Record<string, MasteryItem[]>
    )

  // Add missing items
  mappedItems['vehicle'].push({
    id: 'railjack-plexus',
    name: 'Plexus',
    masteryPoints: 6000,
  })

  const orderedItems = filterEmptySubcategories(mappedItems)

  return Object.assign({}, itemCompletionSubcategoryOrder, orderedItems)
}

export async function buildMasteryData(locale: string): Promise<MasteryData> {
  const itemCompletion = await getItemCompletion(locale)

  const data: MasteryByCategory = {
    itemCompletion,
    railjackIntrinsic: {},
    drifterIntrinsic: {},
    starchartCompletion: {},
  }

  const subcategoryLabels: MasterySubcategoryLabels = {
    itemCompletion: {},
    railjackIntrinsic: {},
    drifterIntrinsic: {},
    starchartCompletion: {},
  }

  return {
    ...data,
    subcategoryLabels,
  }
}
