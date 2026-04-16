import { DialogueNode, Type } from '../types'

export type PathResult = {
  path: number[]
  chemistry: number
  thermostat: number
  hasThermostatCounter: boolean
  activatedBooleans: number
  avoidedBooleanActivations: number
  booleanMutations: Record<string, boolean>
  textLines: string[]
  skippedFlirtingNodeIds?: Set<number>
}

export type LoadedSource = {
  source: string
  nodes: DialogueNode[]
  byId: Map<number, DialogueNode>
  startNodes: DialogueNode[]
}

export type RankedPaths = {
  thermostatEnabled: boolean
  byChemistry: PathResult
  byThermostat?: PathResult
  byBooleans: PathResult
  byBooleansTies: PathResult[]
  byOverall: PathResult
}

export type PreferredPathOption = {
  label: string
  result: PathResult
}

export type ExplorePathsParams = {
  byId: Map<number, DialogueNode>
  node: DialogueNode
  maxDepth: number
  maxPaths: number
  resolveText: (value: string) => string
  askBooleanDecision: (
    node: DialogueNode,
    booleanName: string
  ) => Promise<boolean>
  askCounterBranch: (node: DialogueNode) => Promise<number[]>
}

export const BOOLEAN_CHECK_TYPES = new Set<Type>([
  Type.CheckBooleanDialogueNode,
  Type.CheckBooleanScriptDialogueNode,
  Type.CheckMultiBooleanDialogueNode,
])

export const BOOLEAN_SET_TYPES = new Set<Type>([
  Type.SetBooleanDialogueNode,
  Type.ResetBooleanDialogueNode,
])
