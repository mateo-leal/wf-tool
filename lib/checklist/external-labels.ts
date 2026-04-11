import {
  getDictionary,
  type Dictionary,
  normalizeLanguage,
} from '@/lib/language'
import { type ChecklistTask, type LabelExternal } from '@/lib/types'
import { DAILY_TASKS, OTHER_TASKS, WEEKLY_TASKS } from './tasks'

export type ExternalLabelMap = Record<string, string>

type ExternalLabelSource = NonNullable<LabelExternal['source']>

function getExternalLabelSource(label: LabelExternal): ExternalLabelSource {
  return label.source ?? 'default'
}

export function getExternalLabelId(label: LabelExternal): string {
  return `${getExternalLabelSource(label)}:${label.key}`
}

function collectExternalLabels(
  tasks: ChecklistTask[]
): Map<string, LabelExternal> {
  const labels = new Map<string, LabelExternal>()

  const visit = (items: ChecklistTask[]) => {
    for (const task of items) {
      if (typeof task.title !== 'string') {
        labels.set(getExternalLabelId(task.title), task.title)
      }

      if (task.prerequisite && typeof task.prerequisite !== 'string') {
        labels.set(getExternalLabelId(task.prerequisite), task.prerequisite)
      }

      if (task.npc && typeof task.npc !== 'string') {
        labels.set(getExternalLabelId(task.npc), task.npc)
      }

      if (task.terminal && typeof task.terminal !== 'string') {
        labels.set(getExternalLabelId(task.terminal), task.terminal)
      }

      if (Array.isArray(task.location)) {
        for (const locationLabel of task.location) {
          labels.set(getExternalLabelId(locationLabel), locationLabel)
        }
      }

      if (task.syndicateRank) {
        const syndicateLabel = task.syndicateRank.syndicate
        if (typeof syndicateLabel !== 'string') {
          labels.set(getExternalLabelId(syndicateLabel), syndicateLabel)
        }
      }

      if (task.subitems) {
        visit(task.subitems)
      }
    }
  }

  visit(tasks)
  return labels
}

export async function resolveChecklistExternalLabels(
  locale: string
): Promise<ExternalLabelMap> {
  const tasks = [...DAILY_TASKS, ...WEEKLY_TASKS, ...OTHER_TASKS]
  const labels = collectExternalLabels(tasks)

  if (labels.size === 0) {
    return {}
  }

  const requiredSources = new Set<ExternalLabelSource>()
  for (const label of labels.values()) {
    requiredSources.add(getExternalLabelSource(label))
  }

  const dictionariesBySource = new Map<ExternalLabelSource, Dictionary>()
  await Promise.all(
    [...requiredSources].map(async (source) => {
      const dictionary = await getDictionary(normalizeLanguage(locale), {
        source,
      })
      dictionariesBySource.set(source, dictionary)
    })
  )

  const resolved: ExternalLabelMap = {}
  for (const [id, label] of labels.entries()) {
    const dictionary = dictionariesBySource.get(getExternalLabelSource(label))
    resolved[id] = dictionary?.[label.key] ?? label.key
  }

  return resolved
}
