import { TranscriptLine } from '@/lib/types'

export type DialogueOption = {
  option: number
  id: number
  label: string
  codename: string
}

export type SimulationRequirements = {
  booleans: string[]
  counters: Array<{
    name: string
    expressions: string[]
  }>
}

export type PreferredPathOption = {
  id: string
  label: string
  metrics: string
  path: number[]
  chemistry: number
  thermostat: number
  activatedBooleans: number
  booleanMutations: Record<string, boolean>
  chatLines: Array<TranscriptLine>
}
