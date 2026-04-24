import { BaseItem } from '../types'
import { Data } from '../types/internal'

export abstract class BaseClient<T extends BaseItem> {
  protected locale: string

  constructor(
    protected items: Data<T>,
    locale: string
  ) {
    this.locale = locale
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
