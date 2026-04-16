import {
  isAvoidableBoolean,
  isFlirtingBoolean,
  getFlirtingBooleanSignature,
} from '../boolean-utils'

describe('boolean-utils', () => {
  describe('isAvoidableBoolean', () => {
    it('should detect explicitly avoidable booleans', () => {
      expect(isAvoidableBoolean('LyonSuspicious')).toBe(true)
      expect(isAvoidableBoolean('DrifterLiar')).toBe(true)
    })

    it('should return false for other booleans', () => {
      expect(isAvoidableBoolean('AoiDating')).toBe(false)
      expect(isAvoidableBoolean('QuestCompleted')).toBe(false)
    })
  })

  describe('isFlirtingBoolean', () => {
    it('should detect "Flirt" in boolean names', () => {
      expect(isFlirtingBoolean('LettieFlirt')).toBe(true)
      expect(isFlirtingBoolean('AmirFirstFlirt')).toBe(true)
      expect(isFlirtingBoolean('KayaFlirtPromise')).toBe(true)
    })

    it('should detect "Dating" in boolean names', () => {
      expect(isFlirtingBoolean('AoiDating')).toBe(true)
      expect(isFlirtingBoolean('ArthurDating')).toBe(true)
      expect(isFlirtingBoolean('MarieDating')).toBe(true)
    })

    it('should detect "NoFlirt" in boolean names', () => {
      expect(isFlirtingBoolean('NoFlirt')).toBe(true)
      expect(isFlirtingBoolean('noflirt')).toBe(true)
    })

    it('should detect "NoDate" in boolean names', () => {
      expect(isFlirtingBoolean('NoDate')).toBe(true)
      expect(isFlirtingBoolean('nodate')).toBe(true)
    })

    it('should detect explicitly listed flirting booleans', () => {
      expect(isFlirtingBoolean('QuincyFlirtNo')).toBe(true)
      expect(isFlirtingBoolean('ArthurConfessedFeels')).toBe(true)
    })

    it('should return false for non-flirting booleans', () => {
      expect(isFlirtingBoolean('AoiBoring')).toBe(false)
      expect(isFlirtingBoolean('ArthurFamily')).toBe(false)
      expect(isFlirtingBoolean('AmirRPGArthur')).toBe(false)
    })

    it('should be case-insensitive', () => {
      expect(isFlirtingBoolean('FLIRT')).toBe(true)
      expect(isFlirtingBoolean('FLiRt')).toBe(true)
      expect(isFlirtingBoolean('DATING')).toBe(true)
      expect(isFlirtingBoolean('DaTiNg')).toBe(true)
      expect(isFlirtingBoolean('arthurconfessedfeels')).toBe(true)
    })

    it('should trim surrounding whitespace before matching', () => {
      expect(isFlirtingBoolean('  ArthurConfessedFeels  ')).toBe(true)
      expect(isFlirtingBoolean('   ')).toBe(false)
    })
  })

  describe('getFlirtingBooleanSignature', () => {
    it('should return "no-flirting" when no flirting booleans present', () => {
      const mutations = {
        QuestCompleted: true,
        InventoryChecked: false,
      }
      expect(getFlirtingBooleanSignature(mutations)).toBe('no-flirting')
    })

    it('should generate signature for single flirting boolean', () => {
      const mutations = {
        FlirtWithAlice: true,
      }
      expect(getFlirtingBooleanSignature(mutations)).toBe(
        'flirting:FlirtWithAlice'
      )
    })

    it('should generate signature for multiple flirting booleans sorted', () => {
      const mutations = {
        DatingBob: true,
        FlirtWithAlice: true,
        NoFlirt: false,
      }
      const signature = getFlirtingBooleanSignature(mutations)
      expect(signature).toBe('flirting:DatingBob|FlirtWithAlice|NoFlirt')
    })

    it('should handle mixed flirting and non-flirting booleans', () => {
      const mutations = {
        QuestCompleted: true,
        FlirtWithAlice: true,
        InventoryChecked: false,
        DatingBob: false,
      }
      const signature = getFlirtingBooleanSignature(mutations)
      // Should only include flirting-related booleans
      expect(signature).toContain('DatingBob')
      expect(signature).toContain('FlirtWithAlice')
      expect(signature).not.toContain('QuestCompleted')
      expect(signature).not.toContain('InventoryChecked')
    })

    it('should handle empty mutations object', () => {
      expect(getFlirtingBooleanSignature({})).toBe('no-flirting')
    })
  })
})
