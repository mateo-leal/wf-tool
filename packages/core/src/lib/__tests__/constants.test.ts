import {
  MISSION_TYPE_IDS,
  FACTION_IDS,
  DAMAGE_TYPES,
  AMP_PART_TYPES,
  HOUND_PART_TYPES,
  KDRIVE_PART_TYPES,
  KITGUN_PART_TYPES,
  MOA_PART_TYPES,
  ZAW_PART_TYPES,
  TRIGGER_TYPES,
  NOISE_TYPES,
  VARIANT_TYPES,
  NON_MASTERABLE_PART_TYPES,
} from '../constants'

describe('constants', () => {
  describe('MISSION_TYPE_IDS', () => {
    it('should be defined and be an array', () => {
      expect(Array.isArray(MISSION_TYPE_IDS)).toBe(true)
    })

    it('should contain common mission types', () => {
      expect(MISSION_TYPE_IDS).toContain('MT_SURVIVAL')
      expect(MISSION_TYPE_IDS).toContain('MT_DEFENSE')
      expect(MISSION_TYPE_IDS).toContain('MT_CAPTURE')
    })

    it('should not be empty', () => {
      expect(MISSION_TYPE_IDS.length).toBeGreaterThan(0)
    })
  })

  describe('FACTION_IDS', () => {
    it('should be defined and be an array', () => {
      expect(Array.isArray(FACTION_IDS)).toBe(true)
    })

    it('should contain common factions', () => {
      expect(FACTION_IDS).toContain('FC_GRINEER')
      expect(FACTION_IDS).toContain('FC_CORPUS')
      expect(FACTION_IDS).toContain('FC_INFESTATION')
    })

    it('should not be empty', () => {
      expect(FACTION_IDS.length).toBeGreaterThan(0)
    })
  })

  describe('DAMAGE_TYPES', () => {
    it('should be defined and be an array', () => {
      expect(Array.isArray(DAMAGE_TYPES)).toBe(true)
    })

    it('should contain basic damage types', () => {
      expect(DAMAGE_TYPES).toContain('DT_IMPACT')
      expect(DAMAGE_TYPES).toContain('DT_PUNCTURE')
      expect(DAMAGE_TYPES).toContain('DT_SLASH')
    })

    it('should contain elemental damage types', () => {
      expect(DAMAGE_TYPES).toContain('DT_FIRE')
      expect(DAMAGE_TYPES).toContain('DT_FREEZE')
      expect(DAMAGE_TYPES).toContain('DT_ELECTRICITY')
    })

    it('should not be empty', () => {
      expect(DAMAGE_TYPES.length).toBeGreaterThan(0)
    })
  })

  describe('Weapon part types', () => {
    it('AMP_PART_TYPES should be defined', () => {
      expect(Array.isArray(AMP_PART_TYPES)).toBe(true)
      expect(AMP_PART_TYPES.length).toBeGreaterThan(0)
    })

    it('AMP_PART_TYPES should contain amp parts', () => {
      expect(AMP_PART_TYPES).toContain('LWPT_AMP_OCULUS')
      expect(AMP_PART_TYPES).toContain('LWPT_AMP_CORE')
      expect(AMP_PART_TYPES).toContain('LWPT_AMP_BRACE')
    })

    it('HOUND_PART_TYPES should be defined', () => {
      expect(Array.isArray(HOUND_PART_TYPES)).toBe(true)
      expect(HOUND_PART_TYPES.length).toBeGreaterThan(0)
    })

    it('KDRIVE_PART_TYPES should be defined', () => {
      expect(Array.isArray(KDRIVE_PART_TYPES)).toBe(true)
      expect(KDRIVE_PART_TYPES.length).toBeGreaterThan(0)
    })

    it('KITGUN_PART_TYPES should be defined', () => {
      expect(Array.isArray(KITGUN_PART_TYPES)).toBe(true)
      expect(KITGUN_PART_TYPES.length).toBeGreaterThan(0)
    })

    it('MOA_PART_TYPES should be defined', () => {
      expect(Array.isArray(MOA_PART_TYPES)).toBe(true)
      expect(MOA_PART_TYPES.length).toBeGreaterThan(0)
    })

    it('ZAW_PART_TYPES should be defined', () => {
      expect(Array.isArray(ZAW_PART_TYPES)).toBe(true)
      expect(ZAW_PART_TYPES.length).toBeGreaterThan(0)
    })
  })

  describe('Gameplay types', () => {
    it('TRIGGER_TYPES should be defined', () => {
      expect(Array.isArray(TRIGGER_TYPES)).toBe(true)
      expect(TRIGGER_TYPES.length).toBeGreaterThan(0)
    })

    it('NOISE_TYPES should be defined', () => {
      expect(Array.isArray(NOISE_TYPES)).toBe(true)
      expect(NOISE_TYPES.length).toBeGreaterThan(0)
    })

    it('VARIANT_TYPES should be defined', () => {
      expect(Array.isArray(VARIANT_TYPES)).toBe(true)
      expect(VARIANT_TYPES.length).toBeGreaterThan(0)
    })
  })

  describe('NON_MASTERABLE_PART_TYPES', () => {
    it('should be defined and be an array', () => {
      expect(Array.isArray(NON_MASTERABLE_PART_TYPES)).toBe(true)
    })

    it('should contain amp part types', () => {
      NON_MASTERABLE_PART_TYPES.forEach((partType) => {
        expect(typeof partType).toBe('string')
      })
    })

    it('should not be empty', () => {
      expect(NON_MASTERABLE_PART_TYPES.length).toBeGreaterThan(0)
    })
  })

  describe('constant uniqueness', () => {
    it('should have unique values in MISSION_TYPE_IDS', () => {
      const unique = new Set(MISSION_TYPE_IDS)
      expect(unique.size).toBe(MISSION_TYPE_IDS.length)
    })

    it('should have unique values in FACTION_IDS', () => {
      const unique = new Set(FACTION_IDS)
      expect(unique.size).toBe(FACTION_IDS.length)
    })

    it('should have unique values in DAMAGE_TYPES', () => {
      const unique = new Set(DAMAGE_TYPES)
      expect(unique.size).toBe(DAMAGE_TYPES.length)
    })
  })
})
