import { MASTERY_CHECKLIST_STORAGE_KEY } from '../constants'
import { getDictionary, resolveDictionary } from '../language'
import { fetchPublicExportIntrinsics } from '../public-export/fetch-public-export'
import { toTitleCase } from '../utils'
import type { MasteryItem } from './types'

const RAILJACK_INTRINSIC_MASTERY_POINTS = 1500

export async function getRailjackIntrinsics(locale: string) {
  const [dictionary, intrinsicsMap] = await Promise.all([
    getDictionary(locale),
    fetchPublicExportIntrinsics(),
  ])

  const labels: Record<string, string> = {}

  const masteryItems = Object.entries(intrinsicsMap).reduce(
    (data, [intrinsicKey, intrinsic]) => {
      if (!Object.hasOwn(data, intrinsicKey)) {
        data[intrinsicKey] = []
      }

      const schoolFallback = intrinsicKey.replace('LPS_', '').toLowerCase()
      const schoolName = resolveDictionary(
        dictionary,
        intrinsic.name,
        schoolFallback
      )
      labels[intrinsicKey] = toTitleCase(schoolName)
      const ranks = intrinsic.ranks ?? []

      if (ranks.length === 0) {
        data[intrinsicKey].push({
          id: `intrinsic:${intrinsicKey}`,
          name: schoolName,
          iconUrl: `https://browse.wf${intrinsic.icon}`,
          masteryPoints: RAILJACK_INTRINSIC_MASTERY_POINTS,
        })
        return data
      }

      for (const [index, rank] of ranks.entries()) {
        const rankNumber = index + 1
        const rankFallback = `${schoolName} ${rankNumber}`
        const rankName = resolveDictionary(dictionary, rank.name, rankFallback)

        data[intrinsicKey].push({
          id: `intrinsic:${intrinsicKey}:${rankNumber}`,
          name: rankName,
          iconUrl: `https://browse.wf${intrinsic.icon}`,
          rankNumber,
          masteryPoints: RAILJACK_INTRINSIC_MASTERY_POINTS,
        })
      }
      return data
    },
    {} as Record<string, MasteryItem[]>
  )
  return { masteryItems, labels }
}

export type MasteryProgress = Record<string, boolean>

function normalizeProgress(value: unknown): MasteryProgress {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {}
  }

  const removeLegacyPrefix = (key: string) =>
    key
      .replace(/^warframe:/, '')
      .replace(/^weapon:/, '')
      .replace(/^sentinel:/, '')

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([key]) => key.trim().length > 0)
      .map(([key, checked]) => [removeLegacyPrefix(key), Boolean(checked)])
  )
}

export function loadProgress(): MasteryProgress {
  if (typeof window === 'undefined') {
    return {}
  }

  try {
    const raw = localStorage.getItem(MASTERY_CHECKLIST_STORAGE_KEY)
    if (!raw) {
      return {}
    }

    return normalizeProgress(JSON.parse(raw))
  } catch {
    return {}
  }
}

export function saveProgress(progress: MasteryProgress): void {
  try {
    localStorage.setItem(
      MASTERY_CHECKLIST_STORAGE_KEY,
      JSON.stringify(progress)
    )
  } catch {
    // ignore storage errors
  }
}
