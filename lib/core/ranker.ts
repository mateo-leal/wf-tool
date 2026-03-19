import {
  PathResult,
  RankedPaths,
  PreferredPathOption,
} from './pathfinder-types'
import { getFlirtingBooleanSignature } from './boolean-utils'

export function summarizeResults(results: PathResult[]): RankedPaths {
  const byChemistry = [...results].sort((a, b) => b.chemistry - a.chemistry)[0]
  const thermostatEnabled = results.some(
    (result) => result.hasThermostatCounter
  )
  const byThermostat = thermostatEnabled
    ? [...results].sort((a, b) => b.thermostat - a.thermostat)[0]
    : undefined
  const byBooleans = [...results].sort(
    (a, b) => b.activatedBooleans - a.activatedBooleans
  )[0]
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

    return a.path.length - b.path.length
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
  return result.chemistry * 3 + thermostatScore + result.activatedBooleans
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
    const pathKey = option.result.path.join('->')
    const booleanMutationKey = Object.entries(option.result.booleanMutations)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([name, value]) => `${name}:${value ? '1' : '0'}`)
      .join('|')

    const flirtingSignature = getFlirtingBooleanSignature(
      option.result.booleanMutations
    )

    // Include skipped flirting node IDs to distinguish between "set" and "don't set" paths
    const skippedNodesKey =
      option.result.skippedFlirtingNodeIds &&
      option.result.skippedFlirtingNodeIds.size > 0
        ? 'skipped:' +
          Array.from(option.result.skippedFlirtingNodeIds).sort().join(',')
        : 'none-skipped'

    const outcomeKey = [
      pathKey,
      option.result.chemistry,
      option.result.thermostat,
      option.result.hasThermostatCounter ? 'thermostat' : 'no-thermostat',
      option.result.activatedBooleans,
      flirtingSignature,
      skippedNodesKey,
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
    label: labels.join(' / '),
  }))
}
