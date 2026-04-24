import {
  MASTERY_CHECKLIST_STORAGE_KEY,
  MASTERY_CHECKLIST_STORAGE_KEY_V1,
} from '../storage-keys'

export type MasteryProgress = Record<string, boolean>

export type MasteryStorageV2 = {
  hideCompleted: boolean
  items: MasteryProgress
}

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

function migrateFromV1() {
  // Helper to safely parse old JSON keys
  const getV1 = (): MasteryProgress | null => {
    const data = localStorage.getItem(MASTERY_CHECKLIST_STORAGE_KEY_V1)
    try {
      return data ? normalizeProgress(JSON.parse(data)) : null
    } catch {
      return null
    }
  }

  // Collect old data
  const migratedData: MasteryStorageV2 = {
    items: getV1() || {},
    hideCompleted: false,
  }

  // Persist to new single-key format
  localStorage.setItem(
    MASTERY_CHECKLIST_STORAGE_KEY,
    JSON.stringify(migratedData)
  )

  // Cleanup old keys
  localStorage.removeItem(MASTERY_CHECKLIST_STORAGE_KEY_V1)

  return migratedData
}

function migrateMasteryProgress(): MasteryStorageV2 {
  // Check if migration already happened
  const existingV2 = localStorage.getItem(MASTERY_CHECKLIST_STORAGE_KEY)
  if (existingV2) {
    return JSON.parse(existingV2)
  }

  return migrateFromV1()
}

export function loadProgress(): MasteryStorageV2 {
  if (typeof window === 'undefined') {
    return {
      hideCompleted: false,
      items: {},
    }
  }

  try {
    return migrateMasteryProgress()
  } catch {
    return {
      hideCompleted: false,
      items: {},
    }
  }
}

export function saveProgress(progress: MasteryStorageV2): void {
  try {
    localStorage.setItem(
      MASTERY_CHECKLIST_STORAGE_KEY,
      JSON.stringify(progress)
    )
  } catch {
    // ignore storage errors
  }
}
