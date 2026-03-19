import { DialogueNode, TranscriptLine, Type } from '../types'
import { PathResult } from './pathfinder-types'

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
): TranscriptLine[] {
  const lines: TranscriptLine[] = []

  for (const nodeId of result.path) {
    const node = byId.get(nodeId)
    if (!node) {
      continue
    }

    if (node.type === Type.ChemistryDialogueNode) {
      const delta = node.ChemistryDelta ?? 0
      lines.push({ user: 'system', content: String(delta), type: node.type })
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
    if (node.Speaker) {
      speaker = resolveText(node.Speaker)
    } else if (node.type === Type.DialogueNode) {
      speaker = characterName
    } else if (node.type === Type.PlayerChoiceDialogueNode) {
      speaker = 'player'
    }

    lines.push({ user: speaker, content: text, type: node.type })
  }

  return lines
}
