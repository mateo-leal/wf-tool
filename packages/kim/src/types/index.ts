import { CHATROOMS, NodeType } from '../lib/constants'

export type Node =
  | CheckBooleanDialogueNode
  | CheckBooleanScriptDialogueNode
  | CheckCounterDialogueNode
  | CheckMultiBooleanDialogueNode
  | ChemistryDialogueNode
  | DialogueNode
  | EndDialogueNode
  | IncCounterDialogueNode
  | PlayerChoiceDialogueNode
  | ResetBooleanDialogueNode
  | SetBooleanDialogueNode
  | SpecialCompletionDialogueNode
  | StartDialogueNode

interface BaseNode {
  type: NodeType
  Id: DialogueId
  Incoming: DialogueId[]
  GraphPos: number[]
  Outgoing: DialogueId[]
}

interface BranchingNode extends Omit<BaseNode, 'Outgoing'> {
  TrueNodes: DialogueId[]
  FalseNodes: DialogueId[]
}

export interface CheckBooleanDialogueNode extends BranchingNode {
  type: NodeType.CheckBoolean
  Content: string
}

export interface CheckBooleanScriptDialogueNode extends BranchingNode {
  type: NodeType.CheckBooleanScript
  Content?: string
  Script: Script
}

export interface CheckCounterDialogueNode extends Omit<BaseNode, 'Outgoing'> {
  type: NodeType.CheckCounter
  Content: string
  Outputs: Output[]
  CounterName: string
}

export interface CheckMultiBooleanDialogueNode extends Omit<
  BaseNode,
  'Outgoing'
> {
  type: NodeType.CheckMultiBoolean
  Outputs: Output[]
}

export interface ChemistryDialogueNode extends BaseNode {
  type: NodeType.Chemistry
  ChemistryDelta: number
}

export interface DialogueNode extends BaseNode {
  type: NodeType.Dialogue
  Speaker?: string
  LocTag: TranslationKey
  Delay?: number
  Transmission?: string
}

export interface EndDialogueNode extends Omit<BaseNode, 'Outgoing'> {
  type: NodeType.End
  Content?: string
}

export interface IncCounterDialogueNode extends BaseNode {
  type: NodeType.IncCounter
  Content: string
  Persist?: number
}

export interface PlayerChoiceDialogueNode extends BaseNode {
  type: NodeType.PlayerChoice
  LocTag: TranslationKey
}

export interface ResetBooleanDialogueNode extends BaseNode {
  type: NodeType.ResetBoolean
  Content: string
}

export interface SetBooleanDialogueNode extends BaseNode {
  type: NodeType.SetBoolean
  Content: string
}

export interface SpecialCompletionDialogueNode extends BaseNode {
  type: NodeType.SpecialCompletion
  CompletionType: number
  Content?: string
  OtherDialogueInfos?: OtherDialogueInfo[]
}

export interface StartDialogueNode extends Omit<BaseNode, 'Incoming'> {
  type: NodeType.Start
  Content: string
  IsOptional?: number
  Persist?: number
}

export type Script = {
  Script: string
  Function: string
  _counter: number
  _collectibleType: string
  _syndicate: string
  _syndicateRank: number
  _dialogueType: string
  _rank: number
  _count: number
  _storyCount: number
  _counterName: string
}

export type Output = {
  Expression: string
  Outgoing: DialogueId[]
  Values: number[]
  CompareOperators: number[]
  LogicalOperators: number[]
}

export type OtherDialogueInfo = {
  Dialogue: string
  Tag: string
  Value: number
}

type DialogueId = number
type TranslationKey = string

export type DialogueContentNode = DialogueNode | PlayerChoiceDialogueNode

export type Chatroom = (typeof CHATROOMS)[number]

export type FirstContentNode = {
  id: number
  convoName: string
  dialogueNodes: DialogueContentNode[]
}

/** User-defined state of the simulation */
export type SimulationState = {
  /** A record of boolean values */
  booleans: Record<string, boolean>
  /** A record of counter values */
  counters: Record<string, number>
}

export type OptimizedResults = {
  bestGeneral: DialoguePath[] // Highest count of non-romance, non-avoidable booleans
  bestChemistry: DialoguePath[] // Highest positive Chemistry gain
  bestCounterGains: DialoguePath[] // Highest total sum of counter increments
  bestPositiveRomance: DialoguePath[]
  bestNegativeRomance: DialoguePath[]
}

/**
 * A single path through the dialogue graph,
 * including the final state and tracking information about interactions.
 */
export type DialoguePath = {
  /** The nodes in the path */
  nodes: Node[]
  /** The final state of the simulation */
  finalState: SimulationState
  /**
   * Whether the path is uncertain.
   * A path is considered uncertain if it includes any CheckBooleanScript nodes,
   * since we don't evaluate their conditions in this simulation.
   * This means that for uncertain paths,
   * we can't be sure which branches were actually taken at those nodes,
   * so the path represents one of multiple possible outcomes.
   * */
  isUncertain: boolean
  /** Tracking information for checks */
  checks: {
    /** Names of booleans checked */
    booleans: string[]
    /** Names of counters checked */
    counters: string[]
  }
  /** Tracking information for mutations */
  mutations: {
    /** Cumulative chemistry */
    chemistry: number
    /** Names of booleans set to true */
    set: string[]
    /** Names of booleans set to false */
    reset: string[]
    /**
     * Amounts each counter was incremented by.
     * The amount can be negative if the counter was decremented.
     */
    increments: Record<string, number>
  }
}
