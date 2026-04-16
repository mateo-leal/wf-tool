import { KubrowPet, Sentinel, SpecialItem } from '../types/sentinels'
import { Archwing, Necramech, Warframe } from '../types/warframes'
import {
  Amp,
  Hound,
  KDrive,
  Kitgun,
  MOA,
  SecondaryWeapon,
  SentinelWeapon,
  Weapon,
  Zaw,
} from '../types/weapons'
import { Faction, Intrinsic, MissionType, Region } from '../types/world'
import { BaseProvider, Data } from './base'
import {
  AMP_PART_TYPES,
  HOUND_PART_TYPES,
  KDRIVE_PART_TYPES,
  KITGUN_PART_TYPES,
  MOA_PART_TYPES,
  ZAW_PART_TYPES,
} from './constants'
import { isMasterable } from './filters'
import { sortByName } from './locales'

type Options = {
  locale?: string
}

type FilterOptions = {
  masterable?: boolean
}

export class FactionProvider extends BaseProvider<Faction> {
  static async create(options: Options = {}): Promise<FactionProvider> {
    const { locale = 'en' } = options
    const data = await this.getHydratedData<Faction>('factions', { locale })
    return new FactionProvider(data, locale)
  }
}

export class MissionTypeProvider extends BaseProvider<MissionType> {
  static async create(options: Options = {}): Promise<MissionTypeProvider> {
    const { locale = 'en' } = options
    const data = await this.getHydratedData<MissionType>('missionTypes', {
      locale,
    })
    return new MissionTypeProvider(data, locale)
  }
}

export class RailjackIntrinsicProvider extends BaseProvider<Intrinsic> {
  static async create(
    options: Options = {}
  ): Promise<RailjackIntrinsicProvider> {
    const { locale = 'en' } = options
    const data = await this.getHydratedData<Intrinsic>('railjackIntrinsics', {
      locale,
      skipSorting: true,
    })
    return new RailjackIntrinsicProvider(data, locale)
  }
}

export class RegionProvider extends BaseProvider<Region> {
  static async create(options: Options = {}): Promise<RegionProvider> {
    const { locale = 'en' } = options
    const data = await this.getHydratedData<Region>('regions', { locale })
    return new RegionProvider(data, locale)
  }
}

export class SentinelProvider extends BaseProvider<Sentinel> {
  static async create(options: Options = {}): Promise<SentinelProvider> {
    const { locale = 'en' } = options
    const data = await this.getHydratedData<Sentinel>('sentinels', { locale })
    return new SentinelProvider(data, locale)
  }
}

export class WarframeProvider extends BaseProvider<Warframe> {
  getPrimes(): Warframe[] {
    return this.find((wf): wf is Warframe => wf.variantType === 'VT_PRIME')
  }

  static async create(options: Options = {}): Promise<WarframeProvider> {
    const { locale = 'en' } = options
    const data = await this.getHydratedData<Warframe>('warframes', {
      locale,
      productCategory: 'Suits',
    })
    return new WarframeProvider(data, locale)
  }
}

export class ArchwingProvider extends BaseProvider<Archwing> {
  static async create(options: Options = {}): Promise<ArchwingProvider> {
    const { locale = 'en' } = options
    const data = await this.getHydratedData<Archwing>('warframes', {
      locale,
      productCategory: 'SpaceSuits',
    })
    return new ArchwingProvider(data, locale)
  }
}

export class NecramechProvider extends BaseProvider<Necramech> {
  static async create(options: Options = {}): Promise<NecramechProvider> {
    const { locale = 'en' } = options
    const data = await this.getHydratedData<Necramech>('warframes', {
      locale,
      productCategory: 'MechSuits',
    })
    return new NecramechProvider(data, locale)
  }
}

export class WeaponProvider extends BaseProvider<Weapon> {
  /**
   * Generic filter runner that applies the masterable logic if requested
   */
  private getFiltered<T extends Weapon>(
    options: FilterOptions,
    predicate: (w: Weapon) => w is T
  ): T[] {
    return this.find((w): w is T => {
      const isCorrectType = predicate(w)
      if (!isCorrectType) return false

      if (options.masterable) {
        return isMasterable(w)
      }

      return true
    })
  }

  getPrimaries(options: FilterOptions = {}) {
    return this.getFiltered(options, (w) => w.productCategory === 'LongGuns')
  }

  getSecondaries(options: FilterOptions = {}) {
    return this.getFiltered(
      options,
      (w): w is SecondaryWeapon =>
        w.productCategory === 'Pistols' && !('partType' in w)
    )
  }

  getMelees(options: FilterOptions = {}) {
    return this.getFiltered(options, (w) => w.productCategory === 'Melee')
  }

  getArchguns(options: FilterOptions = {}) {
    return this.getFiltered(options, (w) => w.productCategory === 'SpaceGuns')
  }

  getArchmelees(options: FilterOptions = {}) {
    return this.getFiltered(options, (w) => w.productCategory === 'SpaceMelee')
  }

  getAmps(options: FilterOptions = {}) {
    return this.getFiltered(options, (w): w is Amp => {
      const isSirocco = w.productCategory === 'OperatorAmps'
      const isModularAmp =
        'partType' in w &&
        (AMP_PART_TYPES as readonly string[]).includes(w.partType)

      return isSirocco || isModularAmp
    })
  }

  getRobotics(options: FilterOptions = {}) {
    return this.getFiltered(
      options,
      (w) => w.productCategory === 'SentinelWeapons'
    )
  }

  getKDrives(options: FilterOptions = {}) {
    return this.getFiltered(
      options,
      (w): w is KDrive =>
        'partType' in w &&
        (KDRIVE_PART_TYPES as readonly string[]).includes(w.partType)
    )
  }

  getKitguns(options: FilterOptions = {}) {
    return this.getFiltered(
      options,
      (w): w is Kitgun =>
        'partType' in w &&
        (KITGUN_PART_TYPES as readonly string[]).includes(w.partType)
    )
  }

  getZaws(options: FilterOptions = {}) {
    return this.getFiltered(
      options,
      (w): w is Zaw =>
        'partType' in w &&
        (ZAW_PART_TYPES as readonly string[]).includes(w.partType)
    )
  }

  static async create(options: Options = {}): Promise<WeaponProvider> {
    const { locale = 'en' } = options
    const data = await this.getHydratedData<Weapon>('weapons', { locale })
    return new WeaponProvider(data, locale)
  }
}

export class PetProvider extends BaseProvider<Sentinel | Weapon> {
  static async create(options: Options = {}): Promise<PetProvider> {
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

    return new PetProvider(sortedItems, locale)
  }

  /**
   * Generic filter runner that applies the masterable logic if requested
   */
  private getFiltered<T extends Sentinel | Weapon>(
    options: FilterOptions,
    predicate: (w: Sentinel | Weapon) => w is T
  ): T[] {
    return this.find((w): w is T => {
      const isCorrectType = predicate(w)
      if (!isCorrectType) return false

      if (options.masterable) {
        return isMasterable(w)
      }

      return true
    })
  }

  /**
   * Returns Sentinels (Dethcube, Taxon, etc.)
   */
  getSentinels(options: FilterOptions = {}) {
    return this.getFiltered(
      options,
      (w): w is Sentinel => w.productCategory === 'Sentinels'
    )
  }

  /**
   * Returns Moas (identified by masterable Head parts)
   */
  getMOAs(options: FilterOptions = {}) {
    return this.getFiltered(
      options,
      (w): w is MOA =>
        'partType' in w &&
        (MOA_PART_TYPES as readonly string[]).includes(w.partType)
    )
  }

  /**
   * Returns Hounds
   */
  getHounds(options: FilterOptions = {}) {
    return this.getFiltered(
      options,
      (w): w is Hound =>
        'partType' in w &&
        (HOUND_PART_TYPES as readonly string[]).includes(w.partType)
    )
  }

  /**
   * Returns Biological Pets (Kubrows, Kavats, Predasites, Vulpaphylas)
   */
  getBeasts(
    options: FilterOptions & { includeSpecial: true }
  ): (KubrowPet | SpecialItem)[]
  getBeasts(options?: FilterOptions & { includeSpecial?: false }): KubrowPet[]
  getBeasts(options: FilterOptions & { includeSpecial?: boolean } = {}) {
    const { includeSpecial = false } = options
    const beasts = this.getFiltered(
      options,
      (w) => w.productCategory === 'KubrowPets'
    )
    if (includeSpecial) {
      const specialBeasts = this.getFiltered(
        options,
        (w) => w.productCategory === 'SpecialItems' && 'exalted' in w
      )
      return sortByName([...beasts, ...specialBeasts], { locale: this.locale })
    }
    return beasts
  }

  /**
   * Returns Weapons used by Robotic companions
   */
  getSentinelWeapons(options: FilterOptions = {}) {
    return this.getFiltered(
      options,
      (w) => w.productCategory === 'SentinelWeapons'
    )
  }
}
