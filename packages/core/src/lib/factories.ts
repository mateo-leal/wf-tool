import {
  Archwings as ArchwingClient,
  Factions as FactionClient,
  MissionTypes as MissionTypeClient,
  Necramechs as NecramechClient,
  Pets as PetClient,
  RailjackIntrinsics as RailjackIntrinsicClient,
  Regions as RegionClient,
  Sentinels as SentinelClient,
  Warframes as WarframeClient,
  Weapons as WeaponClient,
} from './clients'
import { Data } from '../types/internal'
import { Sentinel } from '../types/sentinels'
import { BaseItem, Dictionary } from '../types'
import { sortByName, SUPPORTED_LANGUAGES } from './locales'
import { HOUND_PART_TYPES, MOA_PART_TYPES } from './constants'
import { Archwing, Necramech, Warframe } from '../types/warframes'
import { Hound, MOA, SentinelWeapon, Weapon } from '../types/weapons'
import { Faction, Intrinsic, MissionType, Region } from '../types/world'

type Options = {
  locale?: string
}

type HydratedDataOptions = {
  locale?: string
  productCategory?: string
  skipSorting?: boolean
}

export abstract class BaseFactory {
  protected constructor() {}

  /**
   * Static helper used by subclasses to fetch and translate data
   */
  protected static async getHydratedData<T extends BaseItem>(
    category: string,
    { locale, productCategory, skipSorting }: HydratedDataOptions = {}
  ): Promise<Data<T>> {
    const validLocale =
      locale && Object.keys(SUPPORTED_LANGUAGES).includes(locale)
        ? locale
        : 'en'

    const [rawStats, dict] = await Promise.all([
      import(`../../data/stats/${category}.json`).then(
        (m) => m.default as Record<string, T>
      ),
      import(`../../data/dicts/${validLocale}.json`).then(
        (m) => m.default as Dictionary
      ),
    ])

    const entries = Object.entries(rawStats)
      .filter(([_, rawData]) => {
        if (!productCategory) return true
        return (
          'productCategory' in rawData &&
          rawData.productCategory === productCategory
        )
      })
      .map(([uniqueName, rawData]) => {
        const translated = this.translateRecursive(rawData, dict) as T
        return {
          ...translated,
          uniqueName,
        } as T
      })

    // Sort alphabetically by name
    const sorted = skipSorting ? entries : sortByName(entries, { locale })

    // Reconstruct the keyed map (preserving sort order)
    const hydratedMap: Data<T> = {}
    for (const item of sorted) {
      hydratedMap[item.uniqueName] = item
    }

    return hydratedMap
  }

  /**
   * Recursively scans an object/array and replaces any string
   * starting with "/Lotus/Language" with its translation.
   */
  private static translateRecursive(data: unknown, dict: Dictionary): unknown {
    if (typeof data === 'string') {
      let translated = data.startsWith('/Lotus/Language')
        ? (dict[data] ?? data)
        : data
      translated = translated.replace('<ARCHWING>', '').trim() // Remove <ARCHWING> tag from names
      return translated
    }
    if (Array.isArray(data)) {
      return data.map((item) => this.translateRecursive(item, dict))
    }
    if (data !== null && typeof data === 'object') {
      const result: Record<string, unknown> = {}
      for (const [key, value] of Object.entries(data)) {
        result[key] = this.translateRecursive(value, dict)
      }
      return result
    }
    return data
  }
}

export class FactionProvider extends BaseFactory {
  static async create(options: Options = {}) {
    const { locale = 'en' } = options
    const data = await this.getHydratedData<Faction>('factions', { locale })
    return new FactionClient(data, locale)
  }
}

export class MissionTypeProvider extends BaseFactory {
  static async create(options: Options = {}) {
    const { locale = 'en' } = options
    const data = await this.getHydratedData<MissionType>('missionTypes', {
      locale,
    })
    return new MissionTypeClient(data, locale)
  }
}

export class RailjackIntrinsicProvider extends BaseFactory {
  static async create(options: Options = {}) {
    const { locale = 'en' } = options
    const data = await this.getHydratedData<Intrinsic>('railjackIntrinsics', {
      locale,
      skipSorting: true,
    })
    return new RailjackIntrinsicClient(data, locale)
  }
}

export class RegionProvider extends BaseFactory {
  static async create(options: Options = {}) {
    const { locale = 'en' } = options
    const data = await this.getHydratedData<Region>('regions', { locale })
    return new RegionClient(data, locale)
  }
}

export class SentinelProvider extends BaseFactory {
  static async create(options: Options = {}) {
    const { locale = 'en' } = options
    const data = await this.getHydratedData<Sentinel>('sentinels', { locale })
    return new SentinelClient(data, locale)
  }
}

export class WarframeProvider extends BaseFactory {
  static async create(options: Options = {}) {
    const { locale = 'en' } = options
    const data = await this.getHydratedData<Warframe>('warframes', {
      locale,
      productCategory: 'Suits',
    })
    return new WarframeClient(data, locale)
  }
}

export class ArchwingProvider extends BaseFactory {
  static async create(options: Options = {}) {
    const { locale = 'en' } = options
    const data = await this.getHydratedData<Archwing>('warframes', {
      locale,
      productCategory: 'SpaceSuits',
    })
    return new ArchwingClient(data, locale)
  }
}

export class NecramechProvider extends BaseFactory {
  static async create(options: Options = {}) {
    const { locale = 'en' } = options
    const data = await this.getHydratedData<Necramech>('warframes', {
      locale,
      productCategory: 'MechSuits',
    })
    return new NecramechClient(data, locale)
  }
}

export class WeaponProvider extends BaseFactory {
  static async create(options: Options = {}) {
    const { locale = 'en' } = options
    const data = await this.getHydratedData<Weapon>('weapons', { locale })
    return new WeaponClient(data, locale)
  }
}

export class PetProvider extends BaseFactory {
  static async create(options: Options = {}) {
    const { locale = 'en' } = options

    // Load both datasets
    const [rawSentinels, rawWeapons] = await Promise.all([
      this.getHydratedData<Sentinel>('sentinels', { locale }),
      this.getHydratedData<Weapon>('weapons', { locale }),
    ])

    const filteredItems: Data<Sentinel | SentinelWeapon | Hound | MOA> = {}

    // Add everything from sentinels.json (Sentinels, Beasts)
    for (const [key, value] of Object.entries(rawSentinels)) {
      filteredItems[key] = value
    }

    // Add only relevant parts/weapons from weapons.json
    for (const [key, value] of Object.entries(rawWeapons)) {
      const { productCategory } = value

      const isRoboticWeapon = productCategory === 'SentinelWeapons'
      const isMoaHead =
        'partType' in value &&
        (MOA_PART_TYPES as readonly string[]).includes(value.partType)
      const isHoundHead =
        'partType' in value &&
        (HOUND_PART_TYPES as readonly string[]).includes(value.partType)

      if (isRoboticWeapon || isMoaHead || isHoundHead) {
        filteredItems[key] = value as SentinelWeapon | MOA | Hound
      }
    }

    const sortedItems = sortByName(filteredItems, { locale })

    return new PetClient(sortedItems, locale)
  }
}
