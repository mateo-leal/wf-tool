import { isMasterable } from '../filters'
import { BaseItem } from '../../types'

describe('filters', () => {
  describe('isMasterable', () => {
    it('should return true for basic items without partType', () => {
      const item: BaseItem = {
        uniqueName: '/Lotus/Weapons/TestWeapon',
      }
      expect(isMasterable(item)).toBe(true)
    })

    it('should return true for items with masterable partType', () => {
      const item = {
        uniqueName: '/Lotus/Weapons/Melee/TestBlade',
        partType: 'LWPT_BLADE',
      }
      expect(isMasterable(item)).toBe(true)
    })

    it('should return false for non-masterable part types', () => {
      const nonMasterablePartTypes = [
        'LWPT_AMP_CORE',
        'LWPT_AMP_BRACE',
        'LWPT_ZANUKA_BODY',
        'LWPT_ZANUKA_LEG',
        'LWPT_ZANUKA_TAIL',
        'LWPT_MOA_PAYLOAD',
        'LWPT_HB_ENGINE',
        'LWPT_GUN_CLIP',
      ]

      nonMasterablePartTypes.forEach((partType) => {
        const item = {
          uniqueName: '/Lotus/Test/Part',
          partType,
        }
        expect(isMasterable(item)).toBe(false)
      })
    })

    it('should return false for PvP Variant Zaws', () => {
      const item = {
        uniqueName: '/Lotus/Weapons/Melee/TestPvPVariant',
        partType: 'LWPT_BLADE',
      }
      expect(isMasterable(item)).toBe(false)
    })

    it('should return false for Doppelganger Grimoire', () => {
      const item = {
        uniqueName: '/Lotus/Weapons/Grimoires/TnDoppelgangerGrimoire',
        partType: 'LWPT_GRIMOIRE',
      }
      expect(isMasterable(item)).toBe(false)
    })

    it('should return false for melee Vinquibus', () => {
      const item = {
        uniqueName: '/Lotus/Weapons/Melee/TnBayonetMeleeWeapon',
        partType: 'LWPT_MELEE',
      }
      expect(isMasterable(item)).toBe(false)
    })

    it('should handle items without partType but matching uniqueName patterns', () => {
      const items = [
        {
          uniqueName: '/Lotus/Weapons/Grimoires/TnDoppelgangerGrimoire',
        },
        {
          uniqueName: '/Lotus/Weapons/Melee/TnBayonetMeleeWeapon',
        },
      ]

      items.forEach((item) => {
        expect(isMasterable(item)).toBe(false)
      })
    })
  })
})
