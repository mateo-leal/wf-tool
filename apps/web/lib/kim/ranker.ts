import {
  PathResult,
  RankedPaths,
  PreferredPathOption,
} from './pathfinder-types'
import { getFlirtingBooleanSignature } from './boolean-utils'

export function summarizeResults(results: PathResult[]): RankedPaths {
  const byChemistry = [...results].sort((a, b) => {
    const chemistryDiff = b.chemistry - a.chemistry
    if (chemistryDiff !== 0) {
      return chemistryDiff
    }

    return comparePreferredPathTieBreakers(a, b)
  })[0]
  const thermostatEnabled = results.some(
    (result) => result.hasThermostatCounter
  )
  const byThermostat = thermostatEnabled
    ? [...results].sort((a, b) => {
        const thermostatDiff = b.thermostat - a.thermostat
        if (thermostatDiff !== 0) {
          return thermostatDiff
        }

        return comparePreferredPathTieBreakers(a, b)
      })[0]
    : undefined
  const byBooleans = [...results].sort((a, b) => {
    const booleanDiff = b.activatedBooleans - a.activatedBooleans
    if (booleanDiff !== 0) {
      return booleanDiff
    }

    return comparePreferredPathTieBreakers(a, b)
  })[0]
  const maxActivatedBooleans = byBooleans.activatedBooleans
  const byBooleansTies = results.filter(
    (result) => result.activatedBooleans === maxActivatedBooleans
  )
  const byOverall = [...results].sort((a, b) => {
    const scoreDiff =
      overallScore(b, thermostatEnabled) - overallScore(a, thermostatEnabled)
    if (scoreDiff !== 0) {
      return scoreDiff
    }

    return comparePreferredPathTieBreakers(a, b)
  })[0]

  return {
    thermostatEnabled,
    byChemistry,
    byThermostat,
    byBooleans,
    byBooleansTies,
    byOverall,
  }
}

export function overallScore(
  result: PathResult,
  includeThermostat: boolean
): number {
  const thermostatScore = includeThermostat ? result.thermostat * 2 : 0
  const avoidedPenalty = result.avoidedBooleanActivations * 2
  return (
    result.chemistry * 3 +
    thermostatScore +
    result.activatedBooleans -
    avoidedPenalty
  )
}

function comparePreferredPathTieBreakers(
  left: PathResult,
  right: PathResult
): number {
  const avoidedDiff =
    left.avoidedBooleanActivations - right.avoidedBooleanActivations
  if (avoidedDiff !== 0) {
    return avoidedDiff
  }

  return left.path.length - right.path.length
}

function simplifyMergedLabels(labels: string[]): string[] {
  // If we have all three "best" categories, keep only "Best overall path"
  const hasChemistry = labels.some((label) =>
    label.startsWith('Best chemistry path')
  )
  const hasBooleans = labels.some((label) =>
    label.startsWith('Most boolean activations')
  )
  const hasOverall = labels.some((label) =>
    label.startsWith('Best overall path')
  )

  if (hasChemistry && hasBooleans && hasOverall) {
    return labels.filter((label) => label.startsWith('Best overall path'))
  }

  return labels
}

export function buildPreferredPathOptions(
  options: PreferredPathOption[]
): PreferredPathOption[] {
  const uniquePathCount = new Set(
    options.map((option) => option.result.path.join('->'))
  ).size

  if (uniquePathCount <= 1) {
    if (options.length === 0) {
      return []
    }

    return [
      {
        ...options[0],
        label: [...new Set(options.map((option) => option.label))].join(' / '),
      },
    ]
  }

  const mergedByOutcome = new Map<
    string,
    {
      labels: string[]
      option: PreferredPathOption
    }
  >()

  for (const option of options) {
    const booleanMutationKey = Object.entries(option.result.booleanMutations)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([name, value]) => `${name}:${value ? '1' : '0'}`)
      .join('|')

    const flirtingSignature = getFlirtingBooleanSignature(
      option.result.booleanMutations
    )

    const outcomeKey = [
      option.result.chemistry,
      option.result.thermostat,
      option.result.hasThermostatCounter ? 'thermostat' : 'no-thermostat',
      option.result.activatedBooleans,
      option.result.avoidedBooleanActivations,
      flirtingSignature,
      booleanMutationKey,
    ].join('::')

    const existing = mergedByOutcome.get(outcomeKey)
    if (existing) {
      if (!existing.labels.includes(option.label)) {
        existing.labels.push(option.label)
      }
      continue
    }

    mergedByOutcome.set(outcomeKey, {
      labels: [option.label],
      option,
    })
  }

  return [...mergedByOutcome.values()].map(({ labels, option }) => ({
    ...option,
    label: simplifyMergedLabels(labels).join(' / '),
  }))
}
