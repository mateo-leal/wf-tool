import { type ReactNode } from 'react'
import type { Counter } from '../types'

export type ChecklistCategory = 'daily' | 'weekly' | 'other'

export type LabelExternal = {
  key: string
  source?: 'oracle' | 'default'
  format?: 'titleCase'
}

export type ChecklistTask = {
  id: string
  title: LabelExternal | string
  location?: LabelExternal[] | string
  terminal?: LabelExternal | string
  info?: string
  dynamicInfo?: ReactNode
  steelPath?: boolean
  prerequisite?: LabelExternal | string
  syndicateRank?: { syndicate: LabelExternal | string; rank: number }
  npc?: LabelExternal | string
  checkable?: boolean
  resets?: 'daily' | 'weekly' | 'baro' | 'eightHours' | 'sortie' | 'hourly'
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
    hourlyPeriodKey: string
    eightHoursPeriodKey: string
    baroPeriodKey: string
    sortiePeriodKey: string
  }
}

export type ChecklistCounter = {
  label: 'resetsIn' | 'arrivesIn' | 'leavesIn'
  time: Counter
}
