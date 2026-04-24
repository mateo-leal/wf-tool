import {
  AMP_PART_TYPES,
  HOUND_PART_TYPES,
  KDRIVE_PART_TYPES,
  KITGUN_PART_TYPES,
  MOA_PART_TYPES,
  ZAW_PART_TYPES,
} from './constants'
import {
  Amp,
  Hound,
  KDrive,
  Kitgun,
  MOA,
  SecondaryWeapon,
  Weapon,
  Zaw,
} from '../types/weapons'
import { BaseClient } from './base'
import { sortByName } from './locales'
import { isMasterable } from './filters'
import { Archwing, Necramech, Warframe } from '../types/warframes'
import { KubrowPet, Sentinel, SpecialItem } from '../types/sentinels'
import { Faction, Intrinsic, MissionType, Region } from '../types/world'

type FilterOptions = {
  masterable?: boolean
}

export class Factions extends BaseClient<Faction> {}

export class MissionTypes extends BaseClient<MissionType> {}

export class RailjackIntrinsics extends BaseClient<Intrinsic> {}

export class Regions extends BaseClient<Region> {}

export class Sentinels extends BaseClient<Sentinel> {}

export class Warframes extends BaseClient<Warframe> {
  getPrimes(): Warframe[] {
    return this.filter((wf) => wf.variantType === 'VT_PRIME')
  }
}

export class Archwings extends BaseClient<Archwing> {}

export class Necramechs extends BaseClient<Necramech> {}

export class Weapons extends BaseClient<Weapon> {
  /**
   * Generic filter runner that applies the masterable logic if requested
   */
  private getFiltered<T extends Weapon>(
    options: FilterOptions,
    predicate: (w: Weapon) => w is T
  ): T[] {
    return this.filter((w): w is T => {
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
}

export class Pets extends BaseClient<Sentinel | Weapon> {
  /**
   * Generic filter runner that applies the masterable logic if requested
   */
  private getFiltered<T extends Sentinel | Weapon>(
    options: FilterOptions,
    predicate: (w: Sentinel | Weapon) => w is T
  ): T[] {
    return this.filter((w): w is T => {
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
