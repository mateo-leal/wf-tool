import { readFile } from 'node:fs/promises'
import { DialogueNode, DialoguePayload, Output, Type } from '../types'

export type PathResult = {
  path: number[]
  chemistry: number
  thermostat: number
  hasThermostatCounter: boolean
  activatedBooleans: number
  textLines: string[]
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

const BOOLEAN_CHECK_TYPES = new Set<Type>([
  Type.CheckBooleanDialogueNode,
  Type.CheckBooleanScriptDialogueNode,
  Type.CheckMultiBooleanDialogueNode,
])

const BOOLEAN_SET_TYPES = new Set<Type>([
  Type.SetBooleanDialogueNode,
  Type.ResetBooleanDialogueNode,
])

export const DEFAULT_SOURCES = [
  'https://kim.browse.wf/data/AoiDialogue_rom.dialogue.json',
  'https://kim.browse.wf/data/ArthurDialogue_rom.dialogue.json',
  'https://kim.browse.wf/data/EleanorDialogue_rom.dialogue.json',
  'https://kim.browse.wf/data/FlareDialogue_rom.dialogue.json',
  'https://kim.browse.wf/data/HexDialogue_rom.dialogue.json',
  'https://kim.browse.wf/data/JabirDialogue_rom.dialogue.json',
  'https://kim.browse.wf/data/KayaDialogue_rom.dialogue.json',
  'https://kim.browse.wf/data/LettieDialogue_rom.dialogue.json',
  'https://kim.browse.wf/data/MinervaVelemirDialogue_rom.dialogue.json',
  'https://kim.browse.wf/data/QuincyDialogue_rom.dialogue.json',
  'https://kim.browse.wf/data/LoidDialogue_rom.dialogue.json',
  'https://kim.browse.wf/data/LyonDialogue_rom.dialogue.json',
  'https://kim.browse.wf/data/MarieDialogue_rom.dialogue.json',
  'https://kim.browse.wf/data/RoatheDialogue_rom.dialogue.json',
]

export const DEFAULT_DICT_SOURCE = 'https://kim.browse.wf/dicts/es.json'

export async function loadText(source: string): Promise<string> {
  return source.startsWith('http://') || source.startsWith('https://')
    ? await (await fetch(source)).text()
    : await readFile(source, 'utf8')
}

export async function loadNodes(source: string): Promise<DialogueNode[]> {
  const raw = await loadText(source)
  const parsed = JSON.parse(raw) as DialoguePayload

  if (Array.isArray(parsed)) {
    return parsed
  }

  if (Array.isArray(parsed.Nodes)) {
    return parsed.Nodes
  }

  if (Array.isArray(parsed.nodes)) {
    return parsed.nodes
  }

  throw new Error(
    'Unsupported payload shape. Expected an array or object with Nodes/nodes array.'
  )
}

export async function loadDictionary(
  source: string
): Promise<Map<string, string>> {
  const raw = await loadText(source)
  const parsed = JSON.parse(raw) as Record<string, unknown>
  const map = new Map<string, string>()

  for (const [key, value] of Object.entries(parsed)) {
    if (typeof value === 'string') {
      map.set(key, value)
    }
  }

  return map
}

export function resolveStartNodes(nodes: DialogueNode[]): DialogueNode[] {
  const starts = nodes.filter((node) => node.type === Type.StartDialogueNode)
  return starts.length > 0 ? starts : [nodes[0]]
}

export function resolveContent(
  content: string,
  dictionary: Map<string, string>
): string {
  return dictionary.get(content) ?? content
}

export function getConversationName(
  source: string,
  startNode: DialogueNode
): string {
  const sourceName = source.split('/').pop() ?? source
  return startNode.Content ?? `${sourceName}#${startNode.Id}`
}

export function sourceLabel(source: string): string {
  const fileName = source.split('/').pop() ?? source
  return fileName.replace(/Dialogue_rom\.dialogue\.json$/i, '')
}

export function getCounterName(node: DialogueNode): string {
  if (node.CounterName && node.CounterName.trim().length > 0) {
    return node.CounterName.trim()
  }

  if (node.Content && node.Content.trim().length > 0) {
    return (
      node.Content.trim().split(',')[0]?.trim() || `counter-node-${node.Id}`
    )
  }

  return `counter-node-${node.Id}`
}

export function getBooleanName(node: DialogueNode): string {
  if (node.Content && node.Content.trim().length > 0) {
    return node.Content.trim()
  }

  return `boolean-node-${node.Id}`
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

export async function explorePaths(
  params: ExplorePathsParams
): Promise<PathResult[]> {
  const start: PathResult = {
    path: [],
    chemistry: 0,
    thermostat: 0,
    hasThermostatCounter: false,
    activatedBooleans: 0,
    textLines: [],
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

function applyNodeMetrics(
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

  return {
    path: [...acc.path, node.Id],
    chemistry: acc.chemistry + (node.ChemistryDelta ?? 0),
    thermostat: acc.thermostat + thermoFromTags + thermostatFromCounterNode,
    hasThermostatCounter: acc.hasThermostatCounter || hasThermostatCounter,
    activatedBooleans: acc.activatedBooleans + countBooleanActivations(node),
    textLines: resolvedContent
      ? [...acc.textLines, resolvedContent]
      : acc.textLines,
  }
}

function isThermostatCounterNode(node: DialogueNode): boolean {
  return (
    node.type === Type.IncCounterDialogueNode &&
    typeof node.Content === 'string' &&
    /^Thermostat\s+-?\d+$/i.test(node.Content.trim())
  )
}

function extractThermostatDelta(node: DialogueNode): number {
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

function countBooleanActivations(node: DialogueNode): number {
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

async function getOutgoingForNode(
  node: DialogueNode,
  askBooleanDecision: (
    node: DialogueNode,
    booleanName: string
  ) => Promise<boolean>,
  askCounterBranch: (node: DialogueNode) => Promise<number[]>,
  booleanState: Map<string, boolean>
): Promise<number[]> {
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

function applyBooleanMutation(
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
    return options.length > 0 ? [options[0]] : []
  }

  const seenLabels = new Set<string>()
  const dedupedByLabel: PreferredPathOption[] = []

  for (const option of options) {
    if (seenLabels.has(option.label)) {
      continue
    }
    seenLabels.add(option.label)
    dedupedByLabel.push(option)
  }

  return dedupedByLabel
}

export function formatPathMetrics(result: PathResult): string {
  const metrics = [
    `chemistry=${result.chemistry}`,
    `booleans=${result.activatedBooleans}`,
  ]

  if (result.hasThermostatCounter) {
    metrics.push(`thermostat=${result.thermostat}`)
  }

  return ` [${metrics.join(', ')}]`
}

export function formatPathAsChat(
  result: PathResult,
  byId: Map<number, DialogueNode>,
  characterName: string,
  resolveText: (value: string) => string
): { user: string; content: string }[] {
  const lines: { user: string; content: string }[] = []

  for (const nodeId of result.path) {
    const node = byId.get(nodeId)
    if (!node) {
      continue
    }

    if (node.type === Type.ChemistryDialogueNode) {
      const delta = node.ChemistryDelta ?? 0
      const sign = delta >= 0 ? '+' : ''
      lines.push({ user: 'system', content: `[Chemistry ${sign}${delta}]` })
      continue
    }

    if (!node.Content || node.Content.trim().length === 0) {
      continue
    }

    const text = resolveText(node.Content).replace(/\s+/g, ' ').trim()
    if (!text) {
      continue
    }

    let speaker = 'system'
    if (node.type === Type.DialogueNode) {
      speaker = characterName
    } else if (node.type === Type.PlayerChoiceDialogueNode) {
      speaker = 'player'
    }

    lines.push({ user: speaker, content: text })
  }

  return lines
}

function unique(values: number[]): number[] {
  return [...new Set(values)]
}
