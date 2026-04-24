import { BaseItem } from '../types'
import { Data, FilterOptions } from '../types/internal'
import { isMasterable } from './filters'

export abstract class BaseClient<T extends BaseItem> {
  protected locale: string

  constructor(
    protected items: Data<T>,
    locale: string
  ) {
    this.locale = locale
  }

  /**
   * Generic filter runner that applies the masterable logic if requested
   */
  protected getFiltered<E extends T>(
    options: FilterOptions,
    predicate: (w: T) => w is E
  ): E[] {
    return this.filter((w): w is E => {
      const isCorrectType = predicate(w)
      if (!isCorrectType) return false

      if (options.masterable) {
        return isMasterable(w)
      }

      return true
    })
  }

  getAll(): T[] {
    return Object.values(this.items)
  }

  getByUniqueName(uniqueName: string): T | null {
    return this.items[uniqueName] ?? null
  }

  filter<S extends T>(predicate: (item: T) => item is S): S[]
  filter(predicate: (item: T) => boolean): T[]
  filter(predicate: (item: T) => boolean): T[] {
    const results: T[] = []
    for (const item of Object.values(this.items)) {
      if (predicate(item)) results.push(item)
    }
    return results
  }
}
