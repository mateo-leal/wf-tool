import { DialogueNode, Output, Type } from '../types'
import { BOOLEAN_SET_TYPES } from './pathfinder-types'

export function isThermostatCounterNode(node: DialogueNode): boolean {
  return (
    node.type === Type.IncCounterDialogueNode &&
    typeof node.Content === 'string' &&
    /^Thermostat\s+-?\d+$/i.test(node.Content.trim())
  )
}

export function extractThermostatDelta(node: DialogueNode): number {
  if (!isThermostatCounterNode(node) || !node.Content) {
    return 0
  }

  const match = node.Content.trim().match(/^Thermostat\s+(-?\d+)$/i)
  if (!match) {
    return 0
  }

  const value = Number(match[1])
  return Number.isFinite(value) ? value : 0
}

export function evaluateCounterOutput(
  output: Output,
  counterValue: number
): boolean {
  const compareOperators = output.CompareOperators ?? []
  const values = output.Values ?? []
  const logicalOperators = output.LogicalOperators ?? []

  if (compareOperators.length === 0) {
    return output.Expression?.trim().toLowerCase() !== 'false'
  }

  const comparisons: boolean[] = []
  for (let i = 0; i < compareOperators.length; i += 1) {
    const op = Number(compareOperators[i])
    const target = Number(values[i])
    if (Number.isNaN(target)) {
      comparisons.push(false)
      continue
    }

    if (op === 4) {
      comparisons.push(counterValue >= target)
    } else if (op === 3) {
      comparisons.push(counterValue > target)
    } else if (op === 2) {
      comparisons.push(counterValue < target)
    } else if (op === 1) {
      comparisons.push(counterValue <= target)
    } else {
      comparisons.push(false)
    }
  }

  if (comparisons.length === 0) {
    return false
  }

  let result = comparisons[0]
  for (let i = 1; i < comparisons.length; i += 1) {
    const logical = Number(logicalOperators[i - 1])
    if (logical === 1) {
      result = result || comparisons[i]
    } else {
      result = result && comparisons[i]
    }
  }

  return result
}

export function countBooleanActivations(node: DialogueNode): number {
  if (!BOOLEAN_SET_TYPES.has(node.type)) {
    return 0
  }

  const set = new Set<number | string>()
  if (node.Content && node.Content.trim().length > 0) {
    set.add(node.Content.trim())
  }

  for (const value of node.TrueNodes ?? []) {
    set.add(value)
  }
  for (const value of node.FalseNodes ?? []) {
    set.add(value)
  }

  for (const output of node.Outputs ?? []) {
    for (const value of output.Values ?? []) {
      if (typeof value === 'string' || typeof value === 'number') {
        set.add(value)
      }
    }
  }

  return set.size > 0 ? set.size : 1
}
