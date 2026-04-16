import { DialogueNode, Type } from '../types'

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
    return node.Content.trim().split(',')[0]?.trim() || node.Content.trim()
  }

  return `boolean-node-${node.Id}`
}

export function getMultiBooleanNames(node: DialogueNode): string[] {
  if (node.type !== Type.CheckMultiBooleanDialogueNode) {
    return []
  }

  const names = new Set<string>()
  for (const output of node.Outputs ?? []) {
    const expression = output.Expression?.trim()
    if (!expression || expression.toLowerCase() === 'false') {
      continue
    }

    names.add(expression)
  }

  return [...names]
}
