import { DialogueNode, Type } from '../types'
import {
  PathResult,
  ExplorePathsParams,
  BOOLEAN_CHECK_TYPES,
} from './pathfinder-types'
import { getBooleanName } from './node-utils'
import { isAvoidableBoolean, isFlirtingBoolean } from './boolean-utils'
import {
  isThermostatCounterNode,
  extractThermostatDelta,
  countBooleanActivations,
} from './counter-utils'

export async function explorePaths(
  params: ExplorePathsParams
): Promise<PathResult[]> {
  const start: PathResult = {
    path: [],
    chemistry: 0,
    thermostat: 0,
    hasThermostatCounter: false,
    activatedBooleans: 0,
    avoidedBooleanActivations: 0,
    booleanMutations: {},
    textLines: [],
    skippedFlirtingNodeIds: new Set<number>(),
  }

  const state = { pathsCollected: 0 }

  return walk(
    params.byId,
    params.node,
    start,
    params.maxDepth,
    params.maxPaths,
    state,
    params.resolveText,
    params.askBooleanDecision,
    params.askCounterBranch,
    new Map<string, boolean>()
  )
}

async function walk(
  byId: Map<number, DialogueNode>,
  current: DialogueNode,
  acc: PathResult,
  remainingDepth: number,
  maxPaths: number,
  state: { pathsCollected: number },
  resolveText: (value: string) => string,
  askBooleanDecision: (
    node: DialogueNode,
    booleanName: string
  ) => Promise<boolean>,
  askCounterBranch: (node: DialogueNode) => Promise<number[]>,
  booleanState: Map<string, boolean>
): Promise<PathResult[]> {
  if (remainingDepth <= 0 || state.pathsCollected >= maxPaths) {
    return []
  }

  // Check if this is a flirting boolean that should create dual paths
  const booleanName = getBooleanName(current)
  const isFlirtingBoolSetNode =
    (current.type === Type.SetBooleanDialogueNode ||
      current.type === Type.ResetBooleanDialogueNode) &&
    isFlirtingBoolean(booleanName)
  const isAvoidableBoolSetNode =
    current.type === Type.SetBooleanDialogueNode &&
    isAvoidableBoolean(booleanName)

  if (isFlirtingBoolSetNode || isAvoidableBoolSetNode) {
    // Create two branches: one where we set the boolean, one where we don't
    // Do NOT use askBooleanDecision here—we always explore both paths when possible
    const all: PathResult[] = []

    // Branch 1: Set the boolean (normal path)
    {
      const nextAcc = applyNodeMetrics(acc, current, resolveText)
      const nextBooleanState = applyBooleanMutation(current, booleanState)

      if (
        current.type === Type.EndDialogueNode ||
        current.type === Type.SpecialCompletionDialogueNode
      ) {
        state.pathsCollected += 1
        all.push(nextAcc)
      } else {
        const nextIds = await getOutgoingForNode(
          current,
          askBooleanDecision,
          askCounterBranch,
          nextBooleanState
        )
        if (nextIds.length === 0) {
          state.pathsCollected += 1
          all.push(nextAcc)
        } else {
          for (const id of nextIds) {
            if (state.pathsCollected >= maxPaths) {
              break
            }
            const nextNode = byId.get(id)
            if (!nextNode || nextAcc.path.includes(id)) {
              continue
            }
            const childResults = await walk(
              byId,
              nextNode,
              nextAcc,
              remainingDepth - 1,
              maxPaths,
              state,
              resolveText,
              askBooleanDecision,
              askCounterBranch,
              new Map(nextBooleanState)
            )
            all.push(...childResults)
          }
        }
      }
    }

    // Branch 2: Don't set the boolean (alternative path)
    {
      const nextAcc = applyNodeMetricsWithoutBooleanMutation(
        acc,
        current,
        resolveText
      )
      nextAcc.skippedFlirtingNodeIds = new Set([
        ...(acc.skippedFlirtingNodeIds ?? []),
        current.Id,
      ])

      // Explicitly mark the skipped boolean as false so downstream
      // CheckBoolean nodes route through the "not set" branch.
      const nextBooleanState = new Map(booleanState)
      nextBooleanState.set(booleanName, false)
      const nextIds = await getOutgoingForNode(
        current,
        askBooleanDecision,
        askCounterBranch,
        nextBooleanState
      )

      if (
        current.type === Type.EndDialogueNode ||
        current.type === Type.SpecialCompletionDialogueNode
      ) {
        state.pathsCollected += 1
        all.push(nextAcc)
      } else {
        if (nextIds.length === 0) {
          state.pathsCollected += 1
          all.push(nextAcc)
          return all
        }

        for (const id of nextIds) {
          if (state.pathsCollected >= maxPaths) {
            break
          }

          const nextNode = byId.get(id)
          if (!nextNode || nextAcc.path.includes(id)) {
            continue
          }
          const childResults = await walk(
            byId,
            nextNode,
            nextAcc,
            remainingDepth - 1,
            maxPaths,
            state,
            resolveText,
            askBooleanDecision,
            askCounterBranch,
            new Map(nextBooleanState)
          )
          all.push(...childResults)
        }
      }
    }

    return all
  }

  // Normal path handling for non-flirting nodes
  const nextAcc = applyNodeMetrics(acc, current, resolveText)
  const nextBooleanState = applyBooleanMutation(current, booleanState)

  if (
    current.type === Type.EndDialogueNode ||
    current.type === Type.SpecialCompletionDialogueNode
  ) {
    state.pathsCollected += 1
    return [nextAcc]
  }

  const nextIds = await getOutgoingForNode(
    current,
    askBooleanDecision,
    askCounterBranch,
    nextBooleanState
  )
  if (nextIds.length === 0) {
    return [nextAcc]
  }

  const all: PathResult[] = []
  for (const id of nextIds) {
    if (state.pathsCollected >= maxPaths) {
      break
    }

    const nextNode = byId.get(id)
    if (!nextNode) {
      continue
    }

    if (nextAcc.path.includes(id)) {
      continue
    }

    const childResults = await walk(
      byId,
      nextNode,
      nextAcc,
      remainingDepth - 1,
      maxPaths,
      state,
      resolveText,
      askBooleanDecision,
      askCounterBranch,
      new Map(nextBooleanState)
    )
    all.push(...childResults)
  }

  if (all.length === 0) {
    state.pathsCollected += 1
    return [nextAcc]
  }

  return all
}

export function applyNodeMetrics(
  acc: PathResult,
  node: DialogueNode,
  resolveText: (value: string) => string
): PathResult {
  const thermostatFromCounterNode = extractThermostatDelta(node)
  const hasThermostatCounter = isThermostatCounterNode(node)
  const thermoFromTags = (node.OtherDialogueInfos ?? [])
    .filter((info) => info.Tag.toLowerCase().includes('thermostat'))
    .reduce((sum, info) => sum + info.Value, 0)

  const resolvedContent = node.Content ? resolveText(node.Content) : undefined

  const booleanMutation: Record<string, boolean> = {}
  const avoidedBooleanActivationDelta =
    node.type === Type.SetBooleanDialogueNode &&
    isAvoidableBoolean(getBooleanName(node))
      ? 1
      : 0
  if (node.type === Type.SetBooleanDialogueNode) {
    booleanMutation[getBooleanName(node)] = true
  } else if (node.type === Type.ResetBooleanDialogueNode) {
    booleanMutation[getBooleanName(node)] = false
  }

  return {
    path: [...acc.path, node.Id],
    chemistry: acc.chemistry + (node.ChemistryDelta ?? 0),
    thermostat: acc.thermostat + thermoFromTags + thermostatFromCounterNode,
    hasThermostatCounter: acc.hasThermostatCounter || hasThermostatCounter,
    activatedBooleans: acc.activatedBooleans + countBooleanActivations(node),
    avoidedBooleanActivations:
      acc.avoidedBooleanActivations + avoidedBooleanActivationDelta,
    booleanMutations: { ...acc.booleanMutations, ...booleanMutation },
    skippedFlirtingNodeIds: new Set(acc.skippedFlirtingNodeIds),
    textLines: resolvedContent
      ? [...acc.textLines, resolvedContent]
      : acc.textLines,
  }
}

export function applyNodeMetricsWithoutBooleanMutation(
  acc: PathResult,
  node: DialogueNode,
  resolveText: (value: string) => string
): PathResult {
  const thermostatFromCounterNode = extractThermostatDelta(node)
  const hasThermostatCounter = isThermostatCounterNode(node)
  const thermoFromTags = (node.OtherDialogueInfos ?? [])
    .filter((info) => info.Tag.toLowerCase().includes('thermostat'))
    .reduce((sum, info) => sum + info.Value, 0)

  const resolvedContent = node.Content ? resolveText(node.Content) : undefined
  const avoidedBooleanActivationDelta =
    node.type === Type.SetBooleanDialogueNode &&
    isAvoidableBoolean(getBooleanName(node))
      ? 1
      : 0

  return {
    path: [...acc.path, node.Id],
    chemistry: acc.chemistry + (node.ChemistryDelta ?? 0),
    thermostat: acc.thermostat + thermoFromTags + thermostatFromCounterNode,
    hasThermostatCounter: acc.hasThermostatCounter || hasThermostatCounter,
    // Keep counting actual set/reset node visits, even on hypothetical
    // skip branches, so metrics match the shown path.
    activatedBooleans: acc.activatedBooleans + countBooleanActivations(node),
    avoidedBooleanActivations:
      acc.avoidedBooleanActivations + avoidedBooleanActivationDelta,
    booleanMutations: { ...acc.booleanMutations },
    skippedFlirtingNodeIds: new Set(acc.skippedFlirtingNodeIds),
    textLines: resolvedContent
      ? [...acc.textLines, resolvedContent]
      : acc.textLines,
  }
}

export async function getOutgoingForNode(
  node: DialogueNode,
  askBooleanDecision: (
    node: DialogueNode,
    booleanName: string
  ) => Promise<boolean>,
  askCounterBranch: (node: DialogueNode) => Promise<number[]>,
  booleanState: Map<string, boolean>
): Promise<number[]> {
  if (node.type === Type.CheckMultiBooleanDialogueNode) {
    const outputs = node.Outputs ?? []
    if (outputs.length === 0) {
      return unique(node.Outgoing ?? [])
    }

    let fallback: number[] | undefined
    for (const output of outputs) {
      const expression = output.Expression?.trim()
      if (!expression) {
        continue
      }

      if (expression.toLowerCase() === 'false') {
        fallback = output.Outgoing ?? []
        continue
      }

      let decision: boolean
      if (booleanState.has(expression)) {
        decision = booleanState.get(expression) as boolean
      } else {
        decision = await askBooleanDecision(node, expression)
        booleanState.set(expression, decision)
      }

      if (decision) {
        return unique(output.Outgoing ?? [])
      }
    }

    return unique(fallback ?? node.FalseNodes ?? node.Outgoing ?? [])
  }

  if (BOOLEAN_CHECK_TYPES.has(node.type)) {
    const booleanName = getBooleanName(node)
    let decision: boolean
    if (booleanState.has(booleanName)) {
      decision = booleanState.get(booleanName) as boolean
    } else {
      decision = await askBooleanDecision(node, booleanName)
      booleanState.set(booleanName, decision)
    }

    const branch = decision ? node.TrueNodes : node.FalseNodes
    return unique(branch ?? [])
  }

  if (node.type === Type.CheckCounterDialogueNode) {
    return askCounterBranch(node)
  }

  const outputOutgoing = (node.Outputs ?? []).flatMap(
    (output) => output.Outgoing ?? []
  )
  return unique([...(node.Outgoing ?? []), ...outputOutgoing])
}

export function applyBooleanMutation(
  node: DialogueNode,
  currentState: Map<string, boolean>
): Map<string, boolean> {
  const next = new Map(currentState)
  const booleanName = getBooleanName(node)

  if (node.type === Type.SetBooleanDialogueNode) {
    next.set(booleanName, true)
  } else if (node.type === Type.ResetBooleanDialogueNode) {
    next.set(booleanName, false)
  }

  return next
}

function unique(values: number[]): number[] {
  return [...new Set(values)]
}
