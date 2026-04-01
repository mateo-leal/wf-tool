export const BOOLEANS_STORAGE_KEY = 'wf-kim:booleans'
export const COUNTERS_STORAGE_KEY = 'wf-kim:counters'
export const THERMOSTAT_STORAGE_KEY = 'wf-kim:thermostat'
export const COMPLETED_DIALOGUES_STORAGE_KEY = 'wf-kim:completed-dialogues'
export const COMPLETED_DIALOGUES_CHANGE_EVENT =
  'wf-kim:completed-dialogues-change'
export const LANGUAGE_STORAGE_KEY = 'wf-kim:language'
export const SHOW_SPOILERS_STORAGE_KEY = 'wf-kim:show-spoilers'
export const MIGRATION_DONE_KEY = 'wf-kim:migrated'

/** All keys that must be transferred during a domain migration. */
export const ALL_MIGRATION_KEYS = [
  BOOLEANS_STORAGE_KEY,
  COUNTERS_STORAGE_KEY,
  THERMOSTAT_STORAGE_KEY,
  COMPLETED_DIALOGUES_STORAGE_KEY,
  LANGUAGE_STORAGE_KEY,
  SHOW_SPOILERS_STORAGE_KEY,
] as const

export const CHECKLIST_STORAGE_KEY = 'wf-checklist:v1'
export const MASTERY_CHECKLIST_STORAGE_KEY = 'wf-mastery-checklist:v1'
