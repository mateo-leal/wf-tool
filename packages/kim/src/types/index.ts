import { CHATROOMS } from '../lib/constants'

export enum NodeType {
  CheckBoolean = '/EE/Types/Engine/CheckBooleanDialogueNode',
  CheckBooleanScript = '/EE/Types/Engine/CheckBooleanScriptDialogueNode',
  CheckCounter = '/EE/Types/Engine/CheckCounterDialogueNode',
  CheckMultiBoolean = '/EE/Types/Engine/CheckMultiBooleanDialogueNode',
  Chemistry = '/EE/Types/Engine/ChemistryDialogueNode',
  Dialogue = '/EE/Types/Engine/DialogueNode',
  End = '/EE/Types/Engine/EndDialogueNode',
  IncCounter = '/EE/Types/Engine/IncCounterDialogueNode',
  PlayerChoice = '/EE/Types/Engine/PlayerChoiceDialogueNode',
  ResetBoolean = '/EE/Types/Engine/ResetBooleanDialogueNode',
  SetBoolean = '/EE/Types/Engine/SetBooleanDialogueNode',
  SpecialCompletion = '/EE/Types/Engine/SpecialCompletionDialogueNode',
  Start = '/EE/Types/Engine/StartDialogueNode',
}

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

interface CheckBooleanDialogueNode extends BranchingNode {
  type: NodeType.CheckBoolean
  Content: string
}

interface CheckBooleanScriptDialogueNode extends BranchingNode {
  type: NodeType.CheckBooleanScript
  Content?: string
  Script: Script
}

interface CheckCounterDialogueNode extends Omit<BaseNode, 'Outgoing'> {
  type: NodeType.CheckCounter
  Content: string
  Outputs: Output[]
  CounterName: string
}

interface CheckMultiBooleanDialogueNode extends Omit<BaseNode, 'Outgoing'> {
  type: NodeType.CheckMultiBoolean
  Outputs: Output[]
}

interface ChemistryDialogueNode extends BaseNode {
  type: NodeType.Chemistry
  ChemistryDelta: number
}

interface DialogueNode extends BaseNode {
  type: NodeType.Dialogue
  Speaker?: string
  LocTag: TranslationKey
  Delay?: number
  Transmission?: string
}

interface EndDialogueNode extends Omit<BaseNode, 'Outgoing'> {
  type: NodeType.End
  Content?: string
}

export interface IncCounterDialogueNode extends BaseNode {
  type: NodeType.IncCounter
  Content: string
  Persist?: number
}

interface PlayerChoiceDialogueNode extends BaseNode {
  type: NodeType.PlayerChoice
  LocTag: TranslationKey
}

interface ResetBooleanDialogueNode extends BaseNode {
  type: NodeType.ResetBoolean
  Content: string
}

interface SetBooleanDialogueNode extends BaseNode {
  type: NodeType.SetBoolean
  Content: string
}

interface SpecialCompletionDialogueNode extends BaseNode {
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

type Script = {
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

type OtherDialogueInfo = {
  Dialogue: string
  Tag: string
  Value: number
}

type DialogueId = number
type TranslationKey = string

export type Chatroom = (typeof CHATROOMS)[number]
