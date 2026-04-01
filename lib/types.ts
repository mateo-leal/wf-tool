export interface DialogueNode {
  type: Type
  Id: number
  Incoming?: number[]
  GraphPos?: number[]
  LocTag?: string
  Content?: string
  Outgoing?: number[]
  ChemistryDelta?: number
  TrueNodes?: number[]
  FalseNodes?: number[]
  CompletionType?: number
  OtherDialogueInfos?: OtherDialogueInfo[]
  Outputs?: Output[]
  CounterName?: string
  Speaker?: string
  Script?: Script
}

export interface OtherDialogueInfo {
  Dialogue: string
  Tag: string
  Value: number
}

export interface Output {
  Expression: string
  Outgoing: number[]
  Values: unknown[]
  CompareOperators: unknown[]
  LogicalOperators: unknown[]
}

export interface Script {
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
}

export enum Type {
  CheckBooleanDialogueNode = '/EE/Types/Engine/CheckBooleanDialogueNode',
  CheckBooleanScriptDialogueNode = '/EE/Types/Engine/CheckBooleanScriptDialogueNode',
  CheckCounterDialogueNode = '/EE/Types/Engine/CheckCounterDialogueNode',
  CheckMultiBooleanDialogueNode = '/EE/Types/Engine/CheckMultiBooleanDialogueNode',
  ChemistryDialogueNode = '/EE/Types/Engine/ChemistryDialogueNode',
  DialogueNode = '/EE/Types/Engine/DialogueNode',
  EndDialogueNode = '/EE/Types/Engine/EndDialogueNode',
  IncCounterDialogueNode = '/EE/Types/Engine/IncCounterDialogueNode',
  PlayerChoiceDialogueNode = '/EE/Types/Engine/PlayerChoiceDialogueNode',
  ResetBooleanDialogueNode = '/EE/Types/Engine/ResetBooleanDialogueNode',
  SetBooleanDialogueNode = '/EE/Types/Engine/SetBooleanDialogueNode',
  SpecialCompletionDialogueNode = '/EE/Types/Engine/SpecialCompletionDialogueNode',
  StartDialogueNode = '/EE/Types/Engine/StartDialogueNode',
}

export type TranscriptLine = {
  user: string
  content: string
  type: Type
}

// Checklist related types
export type ChecklistCategory = 'daily' | 'weekly' | 'other'

export type ChecklistTask = {
  id: string
  title: string
  location?: string
  terminal?: string
  info?: string
  prerequisite?: string
  npc?: string
  checkable?: boolean
  resets?: 'daily' | 'weekly' | 'baro'
  subitems?: ChecklistTask[]
}

export type ChecklistState = {
  daily: {
    periodKey: string
    completed: Record<string, boolean>
  }
  weekly: {
    periodKey: string
    completed: Record<string, boolean>
  }
  other: {
    completed: Record<string, boolean>
  }
}
