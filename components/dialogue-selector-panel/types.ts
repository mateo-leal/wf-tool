export type DialogueOption = {
  option: number
  id: number
  label: string
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
  chatLines: Array<
    | {
        user: string
        content: string
      }
    | string
  >
}
