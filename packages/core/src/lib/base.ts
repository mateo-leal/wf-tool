import { BaseItem, Dictionary } from '../types'
import { getStandardLocale, sortByName, SUPPORTED_LANGUAGES } from './locales'

export type Data<T> = {
  [key: string]: T
}

type HydratedDataOptions = {
  locale?: string
  productCategory?: string
  skipSorting?: boolean
}

export abstract class BaseProvider<T extends BaseItem> {
  protected locale: string

  protected constructor(
    protected items: Data<T>,
    locale: string
  ) {
    this.locale = locale
  }

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

  getAll(): T[] {
    return Object.values(this.items)
  }

  getByUniqueName(uniqueName: string): T | null {
    return this.items[uniqueName] ?? null
  }

  find<S extends T>(predicate: (item: T) => item is S): S[]
  find(predicate: (item: T) => boolean): T[] {
    const results: T[] = []
    for (const item of Object.values(this.items)) {
      if (predicate(item)) results.push(item)
    }
    return results
  }
}
