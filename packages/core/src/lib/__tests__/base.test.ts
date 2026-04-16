import { BaseProvider, Data } from '../base'
import { BaseItem } from '../../types'

// Mock BaseItem implementation for testing
interface MockItem extends BaseItem {
  name: string
  description?: string
}

// Concrete implementation of abstract BaseProvider for testing
class TestProvider extends BaseProvider<MockItem> {
  constructor(items: Data<MockItem>, locale: string = 'en') {
    super(items, locale)
  }
}

describe('BaseProvider', () => {
  const mockItems: Data<MockItem> = {
    '/Lotus/Items/Item1': {
      uniqueName: '/Lotus/Items/Item1',
      name: 'Item One',
    },
    '/Lotus/Items/Item2': {
      uniqueName: '/Lotus/Items/Item2',
      name: 'Item Two',
      description: 'A second item',
    },
    '/Lotus/Items/Item3': {
      uniqueName: '/Lotus/Items/Item3',
      name: 'Item Three',
    },
  }

  let provider: TestProvider

  beforeEach(() => {
    provider = new TestProvider(mockItems, 'en')
  })

  describe('constructor', () => {
    it('should create a provider with items and locale', () => {
      const testProvider = new TestProvider(mockItems, 'fr')
      expect(testProvider['items']).toEqual(mockItems)
      expect(testProvider['locale']).toBe('fr')
    })

    it('should default to en locale if not specified', () => {
      const testProvider = new TestProvider(mockItems)
      expect(testProvider['locale']).toBe('en')
    })
  })

  describe('getAll', () => {
    it('should return all items as an array', () => {
      const all = provider.getAll()
      expect(all).toHaveLength(3)
      expect(all).toContainEqual(mockItems['/Lotus/Items/Item1'])
      expect(all).toContainEqual(mockItems['/Lotus/Items/Item2'])
      expect(all).toContainEqual(mockItems['/Lotus/Items/Item3'])
    })

    it('should return empty array when no items exist', () => {
      const emptyProvider = new TestProvider({})
      expect(emptyProvider.getAll()).toEqual([])
    })

    it('should preserve item order based on insertion order', () => {
      const ordered: Data<MockItem> = {
        z: { uniqueName: 'z', name: 'Z' },
        a: { uniqueName: 'a', name: 'A' },
        m: { uniqueName: 'm', name: 'M' },
      }
      const provider = new TestProvider(ordered)
      const all = provider.getAll()
      expect(all[0]?.uniqueName).toBe('z')
      expect(all[1]?.uniqueName).toBe('a')
      expect(all[2]?.uniqueName).toBe('m')
    })
  })

  describe('getByUniqueName', () => {
    it('should return an item by its uniqueName', () => {
      const item = provider.getByUniqueName('/Lotus/Items/Item1')
      expect(item).toEqual(mockItems['/Lotus/Items/Item1'])
    })

    it('should return null if item does not exist', () => {
      const item = provider.getByUniqueName('/Lotus/Items/NonExistent')
      expect(item).toBeNull()
    })

    it('should return null for empty string', () => {
      const item = provider.getByUniqueName('')
      expect(item).toBeNull()
    })

    it('should be case-sensitive', () => {
      const item = provider.getByUniqueName('/lotus/items/item1')
      expect(item).toBeNull()
    })

    it('should return the correct item when multiple similar names exist', () => {
      const items: Data<MockItem> = {
        '/Lotus/Items/Test': { uniqueName: '/Lotus/Items/Test', name: 'Test' },
        '/Lotus/Items/TestA': {
          uniqueName: '/Lotus/Items/TestA',
          name: 'Test A',
        },
      }
      const provider = new TestProvider(items)
      expect(provider.getByUniqueName('/Lotus/Items/Test')).toBe(
        items['/Lotus/Items/Test']
      )
      expect(provider.getByUniqueName('/Lotus/Items/TestA')).toBe(
        items['/Lotus/Items/TestA']
      )
    })
  })

  describe('find', () => {
    it('should find items matching a predicate', () => {
      const results = provider.find((item): item is MockItem =>
        item.name.includes('Two')
      )
      expect(results).toHaveLength(1)
      expect(results[0]).toEqual(mockItems['/Lotus/Items/Item2'])
    })

    it('should return empty array if no items match', () => {
      const results = provider.find((item): item is MockItem =>
        item.name.includes('NonExistent')
      )
      expect(results).toEqual([])
    })

    it('should work with type guards', () => {
      interface ItemWithDescription extends MockItem {
        description: string
      }

      const results = provider.find(
        (item): item is ItemWithDescription => 'description' in item
      )
      expect(results).toHaveLength(1)
      expect(results[0]?.name).toBe('Item Two')
      expect('description' in (results[0] || {})).toBe(true)
    })

    it('should find all items when predicate is always true', () => {
      const results = provider.find((item): item is MockItem => true)
      expect(results).toHaveLength(3)
    })

    it('should find no items when predicate is always false', () => {
      const results = provider.find((item): item is MockItem => false)
      expect(results).toEqual([])
    })

    it('should handle complex predicates', () => {
      const results = provider.find(
        (item): item is MockItem =>
          item.uniqueName.includes('Item1') || item.uniqueName.includes('Item3')
      )
      expect(results).toHaveLength(2)
      expect(results.map((i) => i.uniqueName)).toContain('/Lotus/Items/Item1')
      expect(results.map((i) => i.uniqueName)).toContain('/Lotus/Items/Item3')
    })

    it('should preserve order when finding items', () => {
      const results = provider.find((item): item is MockItem => true)
      const uniqueNames = results.map((item) => item.uniqueName)
      expect(uniqueNames).toEqual([
        '/Lotus/Items/Item1',
        '/Lotus/Items/Item2',
        '/Lotus/Items/Item3',
      ])
    })
  })

  describe('locale handling', () => {
    it('should store and preserve the locale', () => {
      const frProvider = new TestProvider(mockItems, 'fr')
      expect(frProvider['locale']).toBe('fr')
    })

    it('should support different locales', () => {
      const locales = ['en', 'fr', 'de', 'ja', 'zh', 'tc']
      locales.forEach((locale) => {
        const p = new TestProvider(mockItems, locale)
        expect(p['locale']).toBe(locale)
      })
    })
  })
})
