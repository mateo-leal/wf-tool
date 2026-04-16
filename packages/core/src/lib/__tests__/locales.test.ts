import { getStandardLocale, sortByName, SUPPORTED_LANGUAGES } from '../locales'

describe('locales', () => {
  describe('SUPPORTED_LANGUAGES', () => {
    it('should contain English', () => {
      expect(SUPPORTED_LANGUAGES.en).toBe('English')
    })

    it('should contain common languages', () => {
      expect(SUPPORTED_LANGUAGES.de).toBe('Deutsch')
      expect(SUPPORTED_LANGUAGES.es).toBe('Español')
      expect(SUPPORTED_LANGUAGES.fr).toBe('Français')
      expect(SUPPORTED_LANGUAGES.ja).toBe('日本語')
      expect(SUPPORTED_LANGUAGES.zh).toBe('简体中文')
      expect(SUPPORTED_LANGUAGES.tc).toBe('繁體中文')
    })

    it('should have 15 supported languages', () => {
      expect(Object.keys(SUPPORTED_LANGUAGES)).toHaveLength(15)
    })
  })

  describe('getStandardLocale', () => {
    it('should convert Warframe locales to standard format', () => {
      const testCases: [string, string][] = [
        ['fr', 'fr-FR'],
        ['it', 'it-IT'],
        ['ja', 'ja-JP'],
        ['ko', 'ko-KR'],
        ['pl', 'pl-PL'],
        ['ru', 'ru-RU'],
        ['tr', 'tr-TR'],
        ['zh', 'zh-CN'],
        ['tc', 'zh-TW'],
        ['th', 'th-TH'],
      ]

      testCases.forEach(([locale, expected]) => {
        expect(getStandardLocale(locale)).toBe(expected)
      })
    })

    it('should return the locale as-is if no mapping exists', () => {
      expect(getStandardLocale('en')).toBe('en')
      expect(getStandardLocale('de')).toBe('de')
      expect(getStandardLocale('es')).toBe('es')
    })

    it('should handle unknown locales gracefully', () => {
      expect(getStandardLocale('unknown')).toBe('unknown')
      expect(getStandardLocale('xx')).toBe('xx')
    })
  })

  describe('sortByName', () => {
    interface TestItem {
      name: string
      id: number
    }

    it('should sort items by name alphabetically', () => {
      const items: TestItem[] = [
        { name: 'Zebra', id: 1 },
        { name: 'Apple', id: 2 },
        { name: 'Banana', id: 3 },
      ]

      const sorted = sortByName(items)
      expect(sorted[0]?.name).toBe('Apple')
      expect(sorted[1]?.name).toBe('Banana')
      expect(sorted[2]?.name).toBe('Zebra')
    })

    it('should handle numeric sorting correctly', () => {
      const items: TestItem[] = [
        { name: 'Weapon 10', id: 1 },
        { name: 'Weapon 2', id: 2 },
        { name: 'Weapon 1', id: 3 },
      ]

      const sorted = sortByName(items)
      expect(sorted[0]?.name).toBe('Weapon 1')
      expect(sorted[1]?.name).toBe('Weapon 2')
      expect(sorted[2]?.name).toBe('Weapon 10')
    })

    it('should be case-insensitive', () => {
      const items: TestItem[] = [
        { name: 'zebra', id: 1 },
        { name: 'Apple', id: 2 },
        { name: 'BANANA', id: 3 },
      ]

      const sorted = sortByName(items)
      expect(sorted[0]?.name).toBe('Apple')
      expect(sorted[1]?.name).toBe('BANANA')
      expect(sorted[2]?.name).toBe('zebra')
    })

    it('should handle items with undefined names', () => {
      const items = [
        { name: undefined as unknown as string, id: 1 },
        { name: 'Apple', id: 2 },
        { name: 'Banana', id: 3 },
      ]

      const sorted = sortByName(items as TestItem[])
      expect(sorted).toHaveLength(3)
    })

    it('should sort arrays and preserve order', () => {
      const items: TestItem[] = [
        { name: 'Charlie', id: 1 },
        { name: 'Alpha', id: 2 },
        { name: 'Bravo', id: 3 },
      ]

      const sorted = sortByName(items)
      expect(sorted).toEqual([
        { name: 'Alpha', id: 2 },
        { name: 'Bravo', id: 3 },
        { name: 'Charlie', id: 1 },
      ])
    })

    it('should handle objects with string keys', () => {
      const items: Record<string, TestItem> = {
        charlie: { name: 'Charlie', id: 1 },
        alpha: { name: 'Alpha', id: 2 },
        bravo: { name: 'Bravo', id: 3 },
      }

      const sorted = sortByName(items)
      const values = Object.values(sorted)
      expect(values[0]?.name).toBe('Alpha')
      expect(values[1]?.name).toBe('Bravo')
      expect(values[2]?.name).toBe('Charlie')
    })

    it('should respect locale parameter when provided', () => {
      const items: TestItem[] = [
        { name: 'Äpfel', id: 1 },
        { name: 'Affe', id: 2 },
      ]

      const sorted = sortByName(items, { locale: 'de' })
      // German collation should handle umlauts correctly
      expect(sorted).toHaveLength(2)
    })

    it('should handle empty arrays', () => {
      const items: TestItem[] = []
      const sorted = sortByName(items)
      expect(sorted).toEqual([])
    })

    it('should handle single item', () => {
      const items: TestItem[] = [{ name: 'Single', id: 1 }]
      const sorted = sortByName(items)
      expect(sorted).toEqual(items)
    })
  })
})
