/**
 * List of supported languages in Warframe. This is not an exhaustive list of all languages, but rather the ones that are currently supported by the game.
 * https://wiki.warframe.com/w/Languages
 */
export const SUPPORTED_LANGUAGES = {
  en: 'English',
  de: 'Deutsch',
  es: 'Español',
  fr: 'Français',
  it: 'Italiano',
  ja: '日本語',
  ko: '한국어',
  pl: 'Polski',
  pt: 'Português',
  ru: 'Русский',
  tr: 'Türkçe',
  uk: 'Українська',
  zh: '简体中文',
  tc: '繁體中文',
  th: 'แบบไทย',
}

export type Locale = keyof typeof SUPPORTED_LANGUAGES

/**
 * Converts a Warframe locale (e.g. "tc") to a standard locale format (e.g. "zh-TW").
 * https://wiki.warframe.com/w/Languages
 * https://gist.github.com/typpo/b2b828a35e683b9bf8db91b5404f1bd1
 * @param locale - Warframe locale.
 * @returns The standard locale format.
 */
export const getStandardLocale = (locale: string): string => {
  const map: Record<string, string> = {
    fr: 'fr-FR',
    it: 'it-IT',
    ja: 'ja-JP',
    ko: 'ko-KR',
    pl: 'pl-PL',
    ru: 'ru-RU',
    tr: 'tr-TR',
    zh: 'zh-CN',
    tc: 'zh-TW',
    th: 'th-TH',
  }
  return map[locale] ?? locale
}

export type Dictionary = Record<string, string>
