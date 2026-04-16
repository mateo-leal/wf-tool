import { BaseItem } from '../types'
import { NON_MASTERABLE_PART_TYPES } from './constants'

export function isMasterable<T extends BaseItem>(item: T): boolean {
  const partType = 'partType' in item ? item.partType : undefined
  const { uniqueName } = item

  if (partType && NON_MASTERABLE_PART_TYPES.includes(partType as string))
    return false
  // PvP Variant Zaws
  if (partType === 'LWPT_BLADE' && uniqueName.includes('PvPVariant'))
    return false
  // duplicate Grimoire
  if (uniqueName.includes('TnDoppelgangerGrimoire')) return false
  // melee Vinquibus
  if (uniqueName.includes('TnBayonetMeleeWeapon')) return false

  return true
}
