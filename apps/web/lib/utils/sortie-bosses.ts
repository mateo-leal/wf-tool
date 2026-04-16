import { toTitleCase } from '.'
import { Dictionary } from '../language'

const SORTIE_BOSS_DICT_KEY = {
  SORTIE_BOSS_CORRUPTED_VOR: '/Lotus/Language/Game/VorTwo',
}

export function getSortieBossName(boss: string, dictionary: Dictionary) {
  const dictKey =
    SORTIE_BOSS_DICT_KEY[boss as keyof typeof SORTIE_BOSS_DICT_KEY]
  if (dictKey) {
    return dictionary[dictKey] ?? boss
  }

  // Fallback: try to convert the boss name from the sortie data to a human-readable format
  // This is needed because some bosses don't have a corresponding entry in the dictionary
  return toTitleCase(boss.replace('SORTIE_BOSS_', '').replace(/_/g, ' '))
}
