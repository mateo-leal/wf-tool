import {
  type Dictionary,
  getStandardLocale,
  SUPPORTED_LANGUAGES,
} from '@tenno-companion/shared/locales'
import { Data } from '../types/internal'

export {
  getStandardLocale,
  SUPPORTED_LANGUAGES,
} from '@tenno-companion/shared/locales'

/**
 * Fetches the appropriate dictionary for the given locale. If the locale is not supported, it falls back to English.
 * @param locale - The locale to fetch the dictionary for (e.g. "en", "fr", "de", etc.).
 * @returns The dictionary for the given locale.
 */
export async function getDictionaries(
  locale: string = 'en'
): Promise<Dictionary> {
  const validLocale = Object.keys(SUPPORTED_LANGUAGES).includes(locale)
    ? locale
    : 'en'
  try {
    return (await import(`../../data/dicts/${validLocale}.json`)).default
  } catch {
    return (await import(`../../data/dicts/en.json`)).default
  }
}

/**
 * Type for sorting options in the sortByName function.
 */
type SortOptions = {
  /** The locale to use for sorting (e.g. "en", "fr", "de", etc.).
   * If locale is not provided, it will default to runtime locale.
   */
  locale?: string
}

/**
 * Sorts items by name using Intl.Collator for locale-aware sorting.
 * @param items - The items to sort. Must have a "name" property.
 * @param options - Sorting options, including the locale to use for sorting.
 * If locale is not provided, it will default to runtime locale.
 * @returns The sorted items.
 * @remarks
 * - Uses Intl.Collator for proper locale-aware sorting, including numeric sorting (e.g. "Weapon 10" comes after "Weapon 2").
 * - Falls back to English locale if the provided locale is not supported.
 * - Handles missing or undefined names gracefully by treating them as empty strings.
 */
export function sortByName<T>(items: T[], options?: { locale?: string }): T[]
export function sortByName<T>(
  items: Data<T>,
  options?: { locale?: string }
): Data<T>
export function sortByName<T>(
  items: T[] | Data<T>,
  options?: { locale?: string }
) {
  const standardLocale = options?.locale
    ? getStandardLocale(options.locale)
    : undefined
  const collator = new Intl.Collator(standardLocale, {
    numeric: true, // "Weapon 10" comes after "Weapon 2"
    sensitivity: 'base', // Often better for case-insensitive sorting
  })

  if (Array.isArray(items)) {
    return items.sort((a, b) => {
      const nameA = (a as any).name || ''
      const nameB = (b as any).name || ''
      return collator.compare(nameA, nameB)
    })
  }

  const entries = Object.entries(items)
  entries.sort(([, a], [, b]) => {
    const nameA = (a as any).name || ''
    const nameB = (b as any).name || ''
    return collator.compare(nameA, nameB)
  })

  // Reconstruct the sorted object
  const sorted: Data<T> = {}
  for (const [key, value] of entries) {
    sorted[key] = value
  }
  return sorted
}
