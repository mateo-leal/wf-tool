import { MASTERY_CHECKLIST_STORAGE_KEY } from '../constants'

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
