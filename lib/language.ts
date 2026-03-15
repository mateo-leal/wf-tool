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

export function getDictionarySource(
  language: string | null | undefined
): string {
  return `https://kim.browse.wf/dicts/${normalizeLanguage(language)}.json`
}
