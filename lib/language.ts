export const DEFAULT_LANGUAGE = 'en'

export const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'de', label: 'Deutsch' },
  { value: 'es', label: 'Español' },
  { value: 'fr', label: 'Français' },
  { value: 'it', label: 'Italiano' },
  { value: 'ja', label: '日本語' },
  { value: 'ko', label: '한국어' },
  { value: 'pl', label: 'Polski' },
  { value: 'pt', label: 'Português' },
  { value: 'ru', label: 'Русский' },
  { value: 'tr', label: 'Türkçe' },
  { value: 'uk', label: 'Українська' },
  { value: 'zh', label: '简体中文' },
  { value: 'tc', label: '繁體中文' },
  { value: 'th', label: 'แบบไทย' },
] as const

const SUPPORTED_LANGUAGES = new Set<string>(
  LANGUAGE_OPTIONS.map((o) => o.value)
)

export function normalizeLanguage(raw: string | null | undefined): string {
  const value = String(raw ?? '')
    .trim()
    .toLowerCase()
  return SUPPORTED_LANGUAGES.has(value) ? value : DEFAULT_LANGUAGE
}

export function getKIMDictionarySource(language?: string): string {
  return `https://kim.browse.wf/dicts/${normalizeLanguage(language)}.json`
}

export function getOracleDictionarySource(language?: string): string {
  return `https://oracle.browse.wf/dicts/${normalizeLanguage(language)}.json`
}

export function getDictionarySource(language?: string): string {
  // return `https://browse.wf/warframe-public-export-plus/dict.${normalizeLanguage(language)}.json`
  return `https://raw.githubusercontent.com/calamity-inc/warframe-public-export-plus/refs/heads/senpai/dict.${normalizeLanguage(language)}.json`
}

export type Dictionary = Record<string, string>

export async function getDictionary(
  language?: string,
  source?: 'kim' | 'oracle' | 'default'
): Promise<Dictionary> {
  try {
    let url: string
    switch (source) {
      case 'kim':
        url = getKIMDictionarySource(language)
        break
      case 'oracle':
        url = getOracleDictionarySource(language)
        break
      default:
        url = getDictionarySource(language)
    }

    const response = await fetch(url, {
      cache: 'force-cache',
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.status}`)
    }
    return (await response.json()) as Dictionary
  } catch {
    if (normalizeLanguage(language) === DEFAULT_LANGUAGE) {
      throw new Error('Failed to fetch dictionary for default locale')
    }

    return getDictionary(DEFAULT_LANGUAGE, source)
  }
}

export function resolveDictionary(
  dictionary: Dictionary,
  nameToken?: string,
  fallback?: string
): string {
  if (!nameToken) {
    return fallback ?? ''
  }

  return dictionary[nameToken] ?? fallback ?? nameToken
}
