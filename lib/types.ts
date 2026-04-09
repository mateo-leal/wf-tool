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

export type LabelExternal = {
  key: string
  source?: 'oracle' | 'default'
}

export type ChecklistTask = {
  id: string
  title: LabelExternal | string
  location?: LabelExternal[] | string
  terminal?: LabelExternal | string
  info?: string
  dynamicInfo?: string
  steelPath?: boolean
  prerequisite?: LabelExternal | string
  syndicateRank?: { syndicate: LabelExternal | string; rank: number }
  npc?: LabelExternal | string
  checkable?: boolean
  resets?: 'daily' | 'weekly' | 'baro' | 'eightHours'
  subitems?: ChecklistTask[]
}

export type ChecklistGroup = {
  periodKey: string
  completed: Record<string, boolean>
  hidden: Record<string, boolean>
  expandedGroups: Record<string, boolean>
}

export type ChecklistState = {
  daily: ChecklistGroup
  weekly: ChecklistGroup
  other: Omit<ChecklistGroup, 'periodKey'> & {
    eightHoursPeriodKey: string
    baroPeriodKey: string
  }
}

export type ChecklistCounter = {
  label: 'resetsIn' | 'arrivesIn' | 'leavesIn'
  time: string
}

export type BountyCycles = {
  expiry: number
  rot: string
  vaultRot: string
  zarimanFaction: string
  bounties: Record<
    string,
    {
      node: string
      challenge: string
      ally?: string
    }[]
  >
}

export type WorldCycle = {
  expiry: number
  state: string
}
